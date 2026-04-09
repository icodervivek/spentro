const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');

const toObjectId = (id) =>
  mongoose.Types.ObjectId.createFromHexString
    ? mongoose.Types.ObjectId.createFromHexString(id)
    : new mongoose.Types.ObjectId(id);

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/reports/monthly?groupId=&month=YYYY-MM
 */
exports.monthlyReport = asyncHandler(async (req, res) => {
  const { groupId, month } = req.query;

  if (!groupId) return res.status(400).json({ message: 'groupId is required' });
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'month must be in YYYY-MM format' });
  }

  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const [result] = await Expense.aggregate([
    {
      $match: {
        group: toObjectId(groupId),
        deletedAt: null,
        date: { $gte: start, $lt: end },
      },
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              expenseCount: { $sum: 1 },
            },
          },
        ],
        byCategory: [
          { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
          { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
        ],
        byPaidBy: [
          { $group: { _id: '$paidBy', paid: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { paid: -1 } },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userInfo',
            },
          },
          {
            $project: {
              _id: 0,
              paid: 1,
              count: 1,
              user: { $arrayElemAt: ['$userInfo', 0] },
            },
          },
          {
            $project: {
              paid: 1,
              count: 1,
              user: { _id: '$user._id', name: '$user.name', avatarUrl: '$user.avatarUrl' },
            },
          },
        ],
      },
    },
  ]);

  const { totalAmount = 0, expenseCount = 0 } = result.summary[0] ?? {};

  res.json({
    month,
    groupId,
    totalAmount,
    expenseCount,
    byCategory: result.byCategory,   // [{ category, total, count }]
    perMember: result.byPaidBy,       // [{ user: { _id, name, avatarUrl }, paid, count }]
  });
});

/**
 * GET /api/v1/reports/category?groupId=&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
exports.categoryReport = asyncHandler(async (req, res) => {
  const { groupId, from, to } = req.query;

  if (!groupId) return res.status(400).json({ message: 'groupId is required' });

  const matchFilter = {
    group: toObjectId(groupId),
    deletedAt: null,
  };

  if (from || to) {
    matchFilter.date = {};
    if (from) matchFilter.date.$gte = new Date(from);
    if (to) matchFilter.date.$lte = new Date(to);
  }

  const raw = await Expense.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    { $project: { _id: 0, category: '$_id', total: 1, count: 1 } },
  ]);

  res.json({
    groupId,
    from: from || null,
    to: to || null,
    breakdown: raw, // [{ category, total, count }]
  });
});
