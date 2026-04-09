const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

/**
 * Distribute totalPaise equally among userIds, ensuring the sum never drifts.
 * The first (remainder) users each receive (base + 1) paise.
 *
 * @param {number}   totalPaise
 * @param {string[]} userIds     array of user id strings
 * @returns {{ user: string, share: number }[]}
 */
const splitEqually = (totalPaise, userIds) => {
  const n = userIds.length;
  if (n === 0) throw new Error('splitEqually: userIds must not be empty');
  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise % n;
  return userIds.map((userId, i) => ({
    user: userId,
    share: i < remainder ? base + 1 : base,
  }));
};

/**
 * Greedy debt-simplification algorithm.
 * Repeatedly matches the largest debtor with the largest creditor.
 *
 * @param {{ userId: string, net: number }[]} nets
 * @returns {{ from: string, to: string, amount: number }[]}
 */
const simplifyDebts = (nets) => {
  const debtors = nets
    .filter((n) => n.net < 0)
    .map((n) => ({ userId: n.userId, amt: -n.net }))
    .sort((a, b) => b.amt - a.amt);

  const creditors = nets
    .filter((n) => n.net > 0)
    .map((n) => ({ userId: n.userId, amt: n.net }))
    .sort((a, b) => b.amt - a.amt);

  const owes = [];

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const transfer = Math.min(debtors[d].amt, creditors[c].amt);
    if (transfer > 0) {
      owes.push({ from: debtors[d].userId, to: creditors[c].userId, amount: transfer });
    }
    debtors[d].amt -= transfer;
    creditors[c].amt -= transfer;
    if (debtors[d].amt === 0) d++;
    if (creditors[c].amt === 0) c++;
  }

  return owes;
};

/**
 * Calculate current balances for a group.
 *
 * Net convention:
 *   positive  → this user is owed money (creditor)
 *   negative  → this user owes money (debtor)
 *
 * @param {string|ObjectId} groupId
 * @returns {{ balances: { userId: string, net: number }[], owes: { from: string, to: string, amount: number }[] }}
 */
const calculateGroupBalances = async (groupId) => {
  const [expenses, settlements] = await Promise.all([
    Expense.find({ group: groupId, deletedAt: null }).lean(),
    Settlement.find({ group: groupId, status: 'confirmed' }).lean(),
  ]);

  const netMap = {};

  const credit = (userId, amount) => {
    const key = userId.toString();
    netMap[key] = (netMap[key] || 0) + amount;
  };

  const debit = (userId, amount) => {
    const key = userId.toString();
    netMap[key] = (netMap[key] || 0) - amount;
  };

  for (const expense of expenses) {
    credit(expense.paidBy, expense.amount);
    for (const entry of expense.splitAmong) {
      debit(entry.user, entry.share);
    }
  }

  for (const settlement of settlements) {
    // fromUser paid toUser: fromUser's debt decreases, toUser's credit decreases
    credit(settlement.fromUser, settlement.amount);
    debit(settlement.toUser, settlement.amount);
  }

  const balances = Object.entries(netMap).map(([userId, net]) => ({ userId, net }));
  const owes = simplifyDebts(balances);

  return { balances, owes };
};

module.exports = { splitEqually, calculateGroupBalances };
