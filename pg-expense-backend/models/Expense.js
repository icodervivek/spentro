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

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
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
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
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
    billImageUrl: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringExpense',
      default: null,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ group: 1, deletedAt: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
