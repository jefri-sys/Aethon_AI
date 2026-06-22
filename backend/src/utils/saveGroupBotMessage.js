const GroupMessage = require('../models/GroupMessage');

async function saveGroupBotMessage(io, groupId, messageContent, aiFeature) {
  try {
    const msg = new GroupMessage({
      groupId,
      message: messageContent,
      messageType: 'text',
      isAIMessage: true,
      aiFeature: aiFeature,
      readBy: []
    });
    
    await msg.save();
    
    io.to("group:" + groupId).emit("newMessage", {
      _id: msg._id,
      groupId,
      senderId: null,
      message: msg.message,
      messageType: msg.messageType,
      isAIMessage: msg.isAIMessage,
      aiFeature: msg.aiFeature,
      createdAt: msg.createdAt,
      readBy: []
    });

    return msg;
  } catch (error) {
    console.error('Error saving bot message:', error);
    throw error;
  }
}

module.exports = {
  saveGroupBotMessage
};
