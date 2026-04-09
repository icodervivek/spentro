const asyncHandler = require('../utils/asyncHandler');
const { calculateGroupBalances } = require('../utils/balanceCalculator');
const User = require('../models/User');

/**
 * GET /api/v1/groups/:groupId/balances
 * Full balance summary + simplified debt list for the group.
 */
exports.getGroupBalances = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const { balances, owes } = await calculateGroupBalances(groupId);

  // Populate user details
  const userIds = balances.map((b) => b.userId);
  const users = await User.find({ _id: { $in: userIds } }).select('name email avatarUrl');
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  const enrichedBalances = balances.map((b) => ({
    user: userMap[b.userId] || b.userId,
    net: b.net,
  }));

  const enrichedOwes = owes.map((o) => ({
    from: userMap[o.from] || o.from,
    to: userMap[o.to] || o.to,
    amount: o.amount,
  }));

  res.json({ balances: enrichedBalances, owes: enrichedOwes });
});

/**
 * GET /api/v1/groups/:groupId/balances/me
 * Current user's net balance and individual debts within the group.
 */
exports.getMyBalance = asyncHandler(async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id.toString();

  const { balances, owes } = await calculateGroupBalances(groupId);

  const myBalance = balances.find((b) => b.userId === userId);
  const net = myBalance ? myBalance.net : 0;

  // Debts: what I owe others and what others owe me
  const iOwe = owes.filter((o) => o.from === userId);
  const owedToMe = owes.filter((o) => o.to === userId);

  const userIds = [
    ...new Set([...iOwe.map((o) => o.to), ...owedToMe.map((o) => o.from)]),
  ];
  const users = await User.find({ _id: { $in: userIds } }).select('name email avatarUrl');
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  res.json({
    net,
    iOwe: iOwe.map((o) => ({ to: userMap[o.to] || o.to, amount: o.amount })),
    owedToMe: owedToMe.map((o) => ({ from: userMap[o.from] || o.from, amount: o.amount })),
  });
});
