const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    category: {
      type: String,
      enum: ['Food', 'Transport', 'Books', 'Entertainment', 'Hostel', 'Miscellaneous'],
      required: true
    },
    note: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    recurring: {
      type: Boolean,
      default: false
    },
    overspendSource: {
      type: String,
      enum: ['Borrowed from friend', 'Extra from parents', 'Used savings', 'Other'],
      required: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
