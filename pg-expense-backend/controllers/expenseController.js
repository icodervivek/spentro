const Joi = require('joi');
const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');
const { splitEqually } = require('../utils/balanceCalculator');

// ─── Validation schema ────────────────────────────────────────────────────────

const createExpenseSchema = Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  amount: Joi.number().integer().min(1).required(),
  category: Joi.string()
    .valid(
      'groceries', 'utilities', 'rent', 'food',
      'household', 'transport', 'entertainment', 'maintenance', 'other'
    )
    .default('other'),
  description: Joi.string().trim().max(500).allow(null, ''),
  splitType: Joi.string().valid('equal', 'exact', 'percentage').default('equal'),
  splitAmong: Joi.array()
    .items(
      Joi.object({
        user: Joi.string().hex().length(24).required(),
        share: Joi.number().min(0).required(),
      })
    )
    .optional(),
  date: Joi.date().iso().default(() => new Date()),
  paidBy: Joi.string().hex().length(24).optional(), // defaults to req.user
}).rename('groupid', 'groupId', { ignoreUndefined: true, override: true });

const updateExpenseSchema = Joi.object({
  amount: Joi.number().integer().min(1),
  category: Joi.string().valid(
    'groceries', 'utilities', 'rent', 'food',
    'household', 'transport', 'entertainment', 'maintenance', 'other'
  ),
  description: Joi.string().trim().max(500).allow(null, ''),
  splitType: Joi.string().valid('equal', 'exact', 'percentage'),
  splitAmong: Joi.array().items(
    Joi.object({
      user: Joi.string().hex().length(24).required(),
      share: Joi.number().min(0).required(),
    })
  ),
  date: Joi.date().iso(),
}).min(1);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateSplitShares = (amount, splitType, splitAmong) => {
  if (!splitAmong || splitAmong.length === 0) return null;

  if (splitType === 'exact') {
    const sum = splitAmong.reduce((acc, s) => acc + s.share, 0);
    if (sum !== amount) {
      return `Exact shares must sum to ${amount} paise but got ${sum}`;
    }
  }

  if (splitType === 'percentage') {
    const sum = splitAmong.reduce((acc, s) => acc + s.share, 0);
    if (sum !== 100) {
      return `Percentage shares must sum to 100 but got ${sum}`;
    }
  }

  return null;
};

/**
 * Convert percentage split to absolute paise shares.
 */
const percentageToShares = (totalPaise, splitAmong) => {
  // Convert each percentage to paise, then fix rounding
  const rawShares = splitAmong.map((s) => ({
    user: s.user,
    share: Math.floor((s.share / 100) * totalPaise),
  }));

  const assignedTotal = rawShares.reduce((acc, s) => acc + s.share, 0);
  let remainder = totalPaise - assignedTotal;

  // Distribute remainder paise one by one, prioritising higher percentage first
  let i = 0;
  while (remainder > 0) {
    rawShares[i % rawShares.length].share += 1;
    remainder--;
    i++;
  }

  return rawShares;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.createExpense = asyncHandler(async (req, res) => {
  // Handle idempotency key
  const idempotencyKey = req.headers['idempotency-key'] || null;
  if (idempotencyKey) {
    const existing = await Expense.findOne({ idempotencyKey });
    if (existing) {
      return res.status(200).json({ expense: existing, idempotent: true });
    }
  }

  const { error, value } = createExpenseSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const { groupId, amount, category, description, splitType, date } = value;
  let { splitAmong, paidBy } = value;

  const group = req.group; // set by requireGroupMember
  const memberIds = group.members.map((m) => m.user.toString());

  paidBy = paidBy || req.user._id.toString();

  if (!memberIds.includes(paidBy.toString())) {
    return res.status(400).json({ message: 'paidBy user is not a group member' });
  }

  // Default equal split among all members if omitted
  if (!splitAmong || splitAmong.length === 0) {
    splitAmong = splitEqually(amount, memberIds);
  } else {
    // Validate all splitAmong users are group members
    for (const entry of splitAmong) {
      if (!memberIds.includes(entry.user.toString())) {
        return res.status(400).json({
          message: `User ${entry.user} is not a member of this group`,
        });
      }
    }

    const validationError = validateSplitShares(amount, splitType, splitAmong);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Convert percentage to absolute paise
    if (splitType === 'percentage') {
      splitAmong = percentageToShares(amount, splitAmong);
    }
  }

  const billImageUrl = req.file ? req.file.path : null;

  const expense = await Expense.create({
    group: groupId,
    paidBy,
    amount,
    category: category || 'other',
    description: description || null,
    splitType: splitType || 'equal',
    splitAmong,
    billImageUrl,
    date: date || new Date(),
    idempotencyKey,
  });

  await logAudit({
    action: 'expense.create',
    entityType: 'Expense',
    entityId: expense._id,
    performedBy: req.user._id,
    group: groupId,
    after: {
      amount,
      category,
      description,
      paidBy,
      splitType,
      splitAmong,
    },
  });

  res.status(201).json({ expense });
});

exports.getExpenses = asyncHandler(async (req, res) => {
  const groupId = req.query.groupId || req.query.groupid;
  const { month, category, page = 1, limit = 20 } = req.query;

  if (!groupId) return res.status(400).json({ message: 'groupId is required' });

  const filter = { group: groupId, deletedAt: null };

  if (month) {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    filter.date = { $gte: start, $lt: end };
  }

  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .populate('paidBy', 'name email avatarUrl')
      .populate('splitAmong.user', 'name email avatarUrl')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Expense.countDocuments(filter),
  ]);

  res.json({
    expenses,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    group: req.group._id,
    deletedAt: null,
  })
    .populate('paidBy', 'name email avatarUrl')
    .populate('splitAmong.user', 'name email avatarUrl');

  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  res.json({ expense });
});

exports.updateExpense = asyncHandler(async (req, res) => {
  const { error, value } = updateExpenseSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const expense = await Expense.findOne({
    _id: req.params.id,
    group: req.group._id,
    deletedAt: null,
  });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  const isGroupAdmin = req.group.isGroupAdmin(req.user._id);
  const isPaidBy = expense.paidBy.toString() === req.user._id.toString();

  if (!isGroupAdmin && !isPaidBy) {
    return res.status(403).json({ message: 'Only the payer or a group admin can edit this expense' });
  }

  const before = expense.toObject();

  const { amount, category, description, splitType, splitAmong, date } = value;
  const newAmount = amount !== undefined ? amount : expense.amount;
  const newSplitType = splitType || expense.splitType;

  if (splitAmong) {
    const memberIds = req.group.members.map((m) => m.user.toString());
    for (const entry of splitAmong) {
      if (!memberIds.includes(entry.user.toString())) {
        return res.status(400).json({ message: `User ${entry.user} is not a group member` });
      }
    }

    const validationError = validateSplitShares(newAmount, newSplitType, splitAmong);
    if (validationError) return res.status(400).json({ message: validationError });

    expense.splitAmong =
      newSplitType === 'percentage'
        ? percentageToShares(newAmount, splitAmong)
        : splitAmong;
  }

  if (amount !== undefined) expense.amount = amount;
  if (category) expense.category = category;
  if (description !== undefined) expense.description = description;
  if (splitType) expense.splitType = splitType;
  if (date) expense.date = date;

  await expense.save();

  await logAudit({
    action: 'expense.update',
    entityType: 'Expense',
    entityId: expense._id,
    performedBy: req.user._id,
    group: expense.group,
    before: {
      amount: before.amount,
      category: before.category,
      description: before.description,
      splitType: before.splitType,
      splitAmong: before.splitAmong,
    },
    after: {
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      splitType: expense.splitType,
      splitAmong: expense.splitAmong,
    },
  });

  res.json({ expense });
});

exports.deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    group: req.group._id,
    deletedAt: null,
  });
  if (!expense) return res.status(404).json({ message: 'Expense not found' });

  const isGroupAdmin = req.group.isGroupAdmin(req.user._id);
  const isPaidBy = expense.paidBy.toString() === req.user._id.toString();

  if (!isGroupAdmin && !isPaidBy) {
    return res.status(403).json({ message: 'Only the payer or a group admin can delete this expense' });
  }

  expense.deletedAt = new Date();
  await expense.save();

  await logAudit({
    action: 'expense.delete',
    entityType: 'Expense',
    entityId: expense._id,
    performedBy: req.user._id,
    group: expense.group,
    before: { amount: expense.amount, description: expense.description },
    after: { deletedAt: expense.deletedAt },
  });

  res.json({ message: 'Expense deleted successfully' });
});
