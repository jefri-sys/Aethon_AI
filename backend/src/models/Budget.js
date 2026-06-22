const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    month: {
      type: String, // e.g., '2026-07'
      required: false // if null, it's the global default budget
    },
    totalBudget: {
      type: Number,
      default: 5000
    },
    food: {
      type: Number,
      default: 1500
    },
    transport: {
      type: Number,
      default: 500
    },
    books: {
      type: Number,
      default: 500
    },
    entertainment: {
      type: Number,
      default: 500
    },
    hostel: {
      type: Number,
      default: 1500
    },
    miscellaneous: {
      type: Number,
      default: 500
    }
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
