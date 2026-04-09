const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const { calculateGroupBalances } = require('../utils/balanceCalculator');

// ─── Users ────────────────────────────────────────────────────────────────────

exports.listUsers = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ name: re }, { email: re }];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  res.json({
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'status must be active or suspended' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');

  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ user });
});

// ─── Groups ───────────────────────────────────────────────────────────────────

exports.listGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [groups, total] = await Promise.all([
    Group.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Group.countDocuments(),
  ]);

  res.json({
    groups,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getGroupDetail = asyncHandler(async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('members.user', 'name email avatarUrl status')
    .populate('createdBy', 'name email');

  if (!group) return res.status(404).json({ message: 'Group not found' });

  const groupObjectId = mongoose.Types.ObjectId.createFromHexString
    ? mongoose.Types.ObjectId.createFromHexString(req.params.id)
    : new mongoose.Types.ObjectId(req.params.id);

  const [expenseCount, totalAmount, expenses, settlements, balanceSummary] = await Promise.all([
    Expense.countDocuments({ group: groupObjectId, deletedAt: null }),
    Expense.aggregate([
      { $match: { group: groupObjectId, deletedAt: null } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.find({ group: groupObjectId, deletedAt: null })
      .populate('paidBy', 'name email')
      .populate('splitAmong.user', 'name email')
      .sort({ date: -1, createdAt: -1 }),
    Settlement.find({ group: groupObjectId })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 }),
    calculateGroupBalances(groupObjectId),
  ]);

  const balanceUserIds = balanceSummary.balances.map((b) => b.userId);
  const balanceUsers = await User.find({ _id: { $in: balanceUserIds } }).select('name email avatarUrl');
  const balanceUserMap = Object.fromEntries(balanceUsers.map((u) => [u._id.toString(), u]));

  const enrichedOwes = (balanceSummary.owes ?? []).map((o) => ({
    from: balanceUserMap[o.from] || o.from,
    to: balanceUserMap[o.to] || o.to,
    fromUser: balanceUserMap[o.from] || null,
    toUser: balanceUserMap[o.to] || null,
    amount: o.amount,
  }));

  res.json({
    group,
    stats: {
      expenseCount,
      totalAmount: totalAmount[0]?.total || 0,
      memberCount: group.members.length,
    },
    transactions: {
      expenses,
      settlements,
    },
    balances: {
      ...balanceSummary,
      owes: enrichedOwes,
    },
  });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

exports.analytics = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    totalGroups,
    activeGroups,
    expenseStats,
    topCategories,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: 'active', updatedAt: { $gte: thirtyDaysAgo } }),
    Group.countDocuments(),
    Group.countDocuments({ isActive: true }),
    Expense.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
  ]);

  res.json({
    totalUsers,
    activeUsers,
    totalGroups,
    activeGroups,
    totalExpenses: expenseStats[0]?.count || 0,
    totalAmountTracked: expenseStats[0]?.totalAmount || 0,
    topCategories,
  });
});

// ─── Audit logs ───────────────────────────────────────────────────────────────

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { groupId, userId, action, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (groupId) filter.group = groupId;
  if (userId) filter.performedBy = userId;
  if (action) filter.action = new RegExp(action, 'i');

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('performedBy', 'name email')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    logs,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});
