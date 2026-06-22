const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['dm', 'group'],
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupName: {
      type: String,
    },
    groupAvatar: {
      type: String,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
