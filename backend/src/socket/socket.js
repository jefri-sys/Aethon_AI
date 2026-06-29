const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const GroupMessage = require('../models/GroupMessage');
const StudyGroup = require('../models/StudyGroup');
const User = require('../models/User');
const { askGroq } = require('../utils/groqGroupAI');
const { saveGroupBotMessage } = require('../utils/saveGroupBotMessage');
const { createNotification } = require('../services/notificationService');

let io;
const userSockets = new Map();
const activeCalls = new Set();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true, // Reflect request origin to avoid CORS blocking
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      
      // Fallback to cookie if auth token is missing
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }

      if (!token || token === 'null') {
        return next(new Error('Authentication error: Token missing'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.id || decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId.toString();
    console.log(`[SOCKET] User connected: ${userId} (Socket ID: ${socket.id})`);
    
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
      console.log(`[SOCKET] Emitting global user:online for ${userId}`);
      io.emit('user:online', userId);
    }
    userSockets.get(userId).add(socket.id);
    
    socket.join(userId);
    
    socket.on('get:online_users', () => {
      const activeUsers = Array.from(userSockets.keys());
      console.log(`[SOCKET] ${userId} requested online users. Sending:`, activeUsers);
      socket.emit('online_users', activeUsers);
    });
    
    socket.on('join:conversation', (conversationId) => {
      if (conversationId) socket.join(conversationId.toString());
    });

    socket.on('leave:conversation', (conversationId) => {
      if (conversationId) socket.leave(conversationId.toString());
    });

    // Group handlers
    socket.on('joinGroup', async ({ groupId }) => {
      try {
        const group = await StudyGroup.findById(groupId);
        if (!group) return;
        const isMember = group.members.some(m => (m.userId._id || m.userId).toString() === userId) || group.createdBy.toString() === userId;
        if (!isMember) return;
        socket.join("group:" + groupId);
        io.to("group:" + groupId).emit("userJoined", { type: "userJoined", userId, timestamp: new Date() });
      } catch (error) {
        console.error("Socket joinGroup error:", error);
      }
    });

    socket.on('leaveGroup', ({ groupId }) => {
      socket.leave("group:" + groupId);
    });

    socket.on('sendMessage', async ({ groupId, message, messageType = 'text', fileUrl, fileName, fileSize }) => {
      try {
        const group = await StudyGroup.findById(groupId);
        if (!group) return;

        const { getMember, hasPermission, isMuted } = require('../utils/groupPermissions');
        const member = getMember(group, userId);
        if (!member) return;

        if (isMuted(member)) {
          const mins = Math.ceil((new Date(member.mutedUntil) - new Date()) / 60000);
          return socket.emit('group:error', { message: `You are currently muted. Mute expires in ${mins} minute(s).` });
        }

        let action = 'sendText';
        if (messageType === 'audio') action = 'sendVoice';
        else if (['image', 'video'].includes(messageType)) action = 'sendMedia';
        else if (messageType === 'document') action = 'sendFiles';

        if (!hasPermission(group, userId, action)) {
          return socket.emit('group:error', { message: 'You do not have permission to send this type of message.' });
        }

        if (group.permissions?.slowMode > 0 && member.role !== 'creator' && member.role !== 'admin') {
          if (member.lastMessageAt) {
            const timeSinceLastMessage = (new Date() - new Date(member.lastMessageAt)) / 1000;
            if (timeSinceLastMessage < group.permissions.slowMode) {
              const waitTime = Math.ceil(group.permissions.slowMode - timeSinceLastMessage);
              return socket.emit('group:error', { message: `Slow mode active. Please wait ${waitTime} seconds.` });
            }
          }
          member.lastMessageAt = new Date();
          await group.save();
        }

        const newMsg = new GroupMessage({
          groupId,
          senderId: userId,
          message,
          messageType,
          fileUrl,
          fileName,
          fileSize
        });
        await newMsg.save();
        
        await newMsg.populate('senderId', 'name avatar');
        
        io.to("group:" + groupId).emit("newMessage", {
          _id: newMsg._id,
          groupId,
          senderId: newMsg.senderId,
          message: newMsg.message,
          messageType: newMsg.messageType,
          fileUrl: newMsg.fileUrl,
          fileName: newMsg.fileName,
          fileSize: newMsg.fileSize,
          createdAt: newMsg.createdAt,
          readBy: []
        });

        // Emit to members' personal rooms for unread badges
        group.members.forEach(async m => {
          const mId = (m.userId._id || m.userId).toString();
          if (mId !== userId) {
            io.to(mId).emit("newMessage", {
              _id: newMsg._id,
              groupId,
              senderId: newMsg.senderId,
              message: newMsg.message,
              messageType: newMsg.messageType
            });
            
            try {
              let displayMsg = newMsg.message;
              if (newMsg.messageType !== 'text') {
                displayMsg = `Sent a ${newMsg.messageType}`;
              }
              await createNotification(
                mId,
                'GROUP_MESSAGE',
                `New message in ${group.name || 'Group'}`,
                `${newMsg.senderId.name}: ${displayMsg.substring(0, 50)}${displayMsg.length > 50 ? '...' : ''}`
              );
            } catch (err) {
              console.error('Failed to create group notification:', err);
            }
          }
        });

        // Event Planner Side Effect
        if (messageType === 'text') {
          setImmediate(async () => {
            try {
              const keywords = ['event', 'fest', 'cultural', 'technical', 'organise', 'organize', 'venue', 'agenda', 'register', 'registration', 'schedule', 'ceremony', 'workshop', 'seminar', 'hackathon', 'concert', 'competition'];
              const textLower = message.toLowerCase();
              if (!keywords.some(kw => textLower.includes(kw))) return;

              const timeSinceLastPlan = group.lastEventPlanAt ? (new Date() - new Date(group.lastEventPlanAt)) : Infinity;
              if (timeSinceLastPlan < 30 * 60 * 1000) return;

              const recentMessages = await GroupMessage.find({ groupId, isAIMessage: { $ne: true } })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('senderId', 'name');
              
              const historyText = recentMessages.reverse().map(m => `${m.senderId?.name || 'User'}: ${m.message}`).join('\n');

              const sysClassify = 'You are a classifier. Respond with ONLY "yes" or "no".';
              const userClassify = `Are the following messages discussing planning a college event (fest, cultural event, seminar, workshop, competition, etc.)?\nMessages:\n${historyText}`;
              
              const classification = await askGroq(sysClassify, userClassify, 50);
              if (!classification.toLowerCase().includes('yes')) return;

              group.lastEventPlanAt = new Date();
              await group.save();

              const sysGenerate = 'You are an expert college event planning assistant for Synapse, a student platform. Generate a concise, structured event plan based on the discussion below. Include: Event Overview, Key Dates & Deadlines, Venue Considerations, Roles & Responsibilities, Checklist of action items, and Estimated Budget Range if inferable. Use markdown formatting. Keep it practical and student-friendly.';
              const userGenerate = `Group subject/context: ${group.course || group.name}\nRecent discussion:\n${historyText}`;

              const planText = await askGroq(sysGenerate, userGenerate, 1024);
              if (planText) {
                await saveGroupBotMessage(io, groupId, planText, 'event_planner');
              }
            } catch (err) {
              console.error('Event Planner error:', err);
            }
          });
        }
      } catch (error) {
        console.error("Socket sendMessage error:", error);
      }
    });

    socket.on('group:markRead', async ({ groupId }) => {
      try {
        const group = await StudyGroup.findById(groupId);
        if (!group) return;
        const isMember = group.members.some(m => (m.userId._id || m.userId).toString() === userId) || group.createdBy.toString() === userId;
        if (!isMember) return;
        
        const unreadMessages = await GroupMessage.find({
          groupId,
          readBy: { $ne: userId }
        });

        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(m => m._id);
          await GroupMessage.updateMany(
            { _id: { $in: messageIds } },
            { $addToSet: { readBy: userId } }
          );

          io.to("group:" + groupId).emit("group:messagesRead", {
            groupId,
            messageIds,
            userId
          });
        }
      } catch (error) {
        console.error("Socket markRead error:", error);
      }
    });

    socket.on('typing', ({ groupId, isTyping }) => {
      socket.to("group:" + groupId).emit("userTyping", { userId, isTyping });
    });

    socket.on('typing:start', ({ conversationId }) => {
      console.log(`[SOCKET] ${userId} typing in conversation: ${conversationId}`);
      socket.to(conversationId).emit('typing:start', { userId, conversationId });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', { userId, conversationId });
    });

    socket.on('messages:seen', async ({ conversationId, messageIds }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds }, seenBy: { $ne: userId } },
          { $addToSet: { seenBy: userId } }
        );
        
        io.to(conversationId).emit('messages:seen:update', { messageIds, seenBy: userId });
      } catch (err) {
        console.error('Error updating seen status:', err);
      }
    });

    socket.on('reaction:add', async ({ messageId, emoji }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        if (!message.reactions) {
          message.reactions = new Map();
        }

        // Must convert Mongoose array to standard array to manipulate easily
        let usersArray = Array.from(message.reactions.get(emoji) || []);
        const userIndex = usersArray.findIndex(id => id.toString() === userId.toString());

        if (userIndex > -1) {
          usersArray.splice(userIndex, 1);
          if (usersArray.length === 0) {
            message.reactions.delete(emoji);
          } else {
            message.reactions.set(emoji, usersArray);
          }
        } else {
          usersArray.push(userId);
          message.reactions.set(emoji, usersArray);
        }

        message.markModified('reactions');
        await message.save();

        const plainReactions = {};
        for (const [key, value] of message.reactions.entries()) {
          plainReactions[key] = Array.from(value);
        }

        io.to(message.conversationId.toString()).emit('reaction:update', {
          messageId,
          reactions: plainReactions
        });
      } catch (err) {
        console.error('Error adding reaction:', err);
      }
    });

    const emitToUser = (targetUserId, event, payload) => {
      const targetSockets = userSockets.get(targetUserId.toString());
      if (targetSockets && targetSockets.size > 0) {
        targetSockets.forEach(socketId => {
          io.to(socketId).emit(event, payload);
        });
      }
    };

    socket.on('call:initiate', ({ recipientId, callerInfo, type, conversationId }) => {
      console.log(`[SOCKET] ${userId} initiated ${type} call to ${recipientId}`);
      if (activeCalls.has(recipientId.toString())) {
        emitToUser(userId, 'call:busy:global', { recipientId: recipientId.toString() });
        return;
      }
      activeCalls.add(userId);
      activeCalls.add(recipientId.toString());

      emitToUser(recipientId, 'call:incoming:global', {
        recipientId: recipientId.toString(),
        callerId: userId,
        callerInfo,
        type,
        conversationId
      });
    });

    socket.on('call:offer', ({ recipientId, offer }) => {
      emitToUser(recipientId, 'call:offer:global', {
        recipientId: recipientId.toString(),
        callerId: userId,
        offer
      });
    });

    socket.on('call:answer', ({ callerId, answer }) => {
      activeCalls.add(userId);
      activeCalls.add(callerId.toString());
      emitToUser(callerId, 'call:answer:global', {
        recipientId: callerId.toString(),
        answer
      });
    });

    socket.on('call:ice-candidate', ({ recipientId, candidate }) => {
      emitToUser(recipientId, 'call:ice-candidate:global', {
        recipientId: recipientId.toString(),
        candidate
      });
    });

    socket.on('call:end', ({ recipientId }) => {
      activeCalls.delete(userId);
      if (recipientId) activeCalls.delete(recipientId.toString());
      if (recipientId) {
        emitToUser(recipientId, 'call:ended:global', {
          recipientId: recipientId.toString()
        });
      }
    });

    socket.on('call:reject', ({ callerId }) => {
      activeCalls.delete(userId);
      if (callerId) activeCalls.delete(callerId.toString());
      if (callerId) {
        emitToUser(callerId, 'call:reject:global', {
          rejectedBy: userId
        });
      }
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          io.emit('user:offline', userId);
        }
      }
      activeCalls.delete(userId);
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO, userSockets };
