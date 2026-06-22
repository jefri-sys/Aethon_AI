const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  college: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  course: {
    type: String,
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['creator', 'admin', 'moderator', 'member'],
      default: 'member'
    },
    mutedUntil: {
      type: Date,
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: null
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  permissions: {
    sendText:         { allowedRoles: { type: [String], default: ['creator','admin','moderator','member'] } },
    sendVoice:        { allowedRoles: { type: [String], default: ['creator','admin','moderator'] } },
    sendMedia:        { allowedRoles: { type: [String], default: ['creator','admin','moderator'] } },
    sendFiles:        { allowedRoles: { type: [String], default: ['creator','admin','moderator'] } },
    sendLinks:        { allowedRoles: { type: [String], default: ['creator','admin','moderator','member'] } },
    reactToMessages:  { allowedRoles: { type: [String], default: ['creator','admin','moderator','member'] } },
    addMembers:       { allowedRoles: { type: [String], default: ['creator','admin'] } },
    removeMembers:    { allowedRoles: { type: [String], default: ['creator','admin'] } },
    deleteAnyMessage: { allowedRoles: { type: [String], default: ['creator','admin'] } },
    pinMessages:      { allowedRoles: { type: [String], default: ['creator','admin','moderator'] } },
    muteMember:       { allowedRoles: { type: [String], default: ['creator','admin','moderator'] } },
    editGroupInfo:    { allowedRoles: { type: [String], default: ['creator','admin'] } },
    slowMode:         { type: Number, default: 0 }
  },
  lastEventPlanAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
