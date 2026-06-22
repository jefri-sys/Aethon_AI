const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const GroupMessage = require('../models/GroupMessage');
const StudyGroup = require('../models/StudyGroup');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

let io;

const init = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', async (socket) => {
    try {
      // Extract JWT from socket.handshake.auth.token or cookie
      let token = socket.handshake.auth?.token;
      
      if (!token && socket.handshake.headers.cookie) {
        const cookieStr = socket.handshake.headers.cookie;
        const match = cookieStr.match(/(?:^|;\s*)token=([^;]*)/);
        if (match) {
          token = match[1];
        }
      }

      if (!token) {
        return socket.disconnect(true);
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return socket.disconnect(true);
      }

      // We can grab user data to populate the senderName
      const user = await User.findById(decoded.id).select('name');
      if (!user) {
        return socket.disconnect(true);
      }

      socket.data.userId = decoded.id;
      socket.data.userName = user.name;
      socket.join("user:" + decoded.id);

      // Events
      socket.on('joinGroup', async ({ groupId }) => {
        try {
          const group = await StudyGroup.findById(groupId);
          if (!group) return;

          const isMember = group.members.some(m => m.userId.toString() === decoded.id) || group.createdBy.toString() === decoded.id;
          if (!isMember) return;

          socket.join("group:" + groupId);
          
          io.to("group:" + groupId).emit("userJoined", {
            type: "userJoined",
            userId: decoded.id,
            timestamp: new Date()
          });
        } catch (error) {
          console.error("Socket joinGroup error:", error);
        }
      });

      socket.on('leaveGroup', ({ groupId }) => {
        socket.leave("group:" + groupId);
      });

      socket.on('sendMessage', async ({ groupId, message }) => {
        try {
          const newMsg = new GroupMessage({
            groupId,
            senderId: decoded.id,
            message
          });
          await newMsg.save();

          io.to("group:" + groupId).emit("newMessage", {
            _id: newMsg._id,
            groupId,
            senderId: decoded.id,
            senderName: socket.data.userName,
            message: newMsg.message,
            createdAt: newMsg.createdAt
          });

          // Create notification for other members
          const group = await StudyGroup.findById(groupId);
          if (group) {
            const memberIds = group.members.map(m => m.userId.toString());
            if (group.createdBy && !memberIds.includes(group.createdBy.toString())) {
              memberIds.push(group.createdBy.toString());
            }
            
            for (const memberId of memberIds) {
              if (memberId !== decoded.id) {
                // To avoid massive spam, maybe check if they are offline? 
                // Socket.io doesn't make this trivial here without keeping a connected map.
                // We'll just create it.
                await createNotification(
                  memberId,
                  'NEW_MESSAGE',
                  `New Message in ${group.name}`,
                  `${socket.data.userName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
                );
              }
            }
          }

        } catch (error) {
          console.error("Socket sendMessage error:", error);
        }
      });

      socket.on('typing', ({ groupId, isTyping }) => {
        socket.to("group:" + groupId).emit("userTyping", {
          userId: decoded.id,
          userName: socket.data.userName,
          isTyping
        });
      });

    } catch (err) {
      console.error("Socket auth error:", err.message);
      socket.disconnect(true);
    }
  });
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { init, getIO };
