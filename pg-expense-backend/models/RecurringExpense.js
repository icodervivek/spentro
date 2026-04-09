const mongoose = require('mongoose');

const splitEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    share: {
      type: Number,
      required: true,
      min: [0, 'Share cannot be negative'],
    },
  },
  { _id: false }
);

const recurringExpenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1 paise'],
    },
    category: {
      type: String,
      enum: [
        'groceries',
        'utilities',
        'rent',
        'food',
        'household',
        'transport',
        'entertainment',
        'maintenance',
        'other',
      ],
      default: 'other',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage'],
      default: 'equal',
    },
    splitAmong: [splitEntrySchema],
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 28,
      default: null,
    },
    nextRunDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
