const Joi = require('joi');
const Settlement = require('../models/Settlement');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');

// ─── Validation schemas ──────────────────────────────────────────────────────

const createSettlementSchema = Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  toUser: Joi.string().hex().length(24).required(),
  amount: Joi.number().integer().min(1).required(),
  method: Joi.string().valid('cash', 'upi', 'bank', 'other').default('cash'),
  note: Joi.string().trim().max(300).allow(null, ''),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

exports.createSettlement = asyncHandler(async (req, res) => {
  const { error } = createSettlementSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const { groupId, toUser, amount, method, note } = req.body;
  const group = req.group; // attached by requireGroupMember

  if (req.user._id.toString() === toUser) {
    return res.status(400).json({ message: 'Cannot settle with yourself' });
  }

  if (!group.isMember(toUser)) {
    return res.status(400).json({ message: 'Recipient is not a member of this group' });
  }

  const settlement = await Settlement.create({
    group: groupId,
    fromUser: req.user._id,
    toUser,
    amount,
    method: method || 'cash',
    note: note || null,
    status: 'pending',
  });

  await logAudit({
    action: 'settlement.create',
    entityType: 'Settlement',
    entityId: settlement._id,
    performedBy: req.user._id,
    group: groupId,
    after: { fromUser: req.user._id, toUser, amount, status: 'pending' },
  });

  res.status(201).json({ settlement });
});

exports.confirmSettlement = asyncHandler(async (req, res) => {
  const settlement = await Settlement.findById(req.params.id);
  if (!settlement) return res.status(404).json({ message: 'Settlement not found' });

  if (!req.group.isMember(req.user._id)) {
    return res.status(403).json({ message: 'Not a member of this group' });
  }

  if (settlement.toUser.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the receiver can confirm this settlement' });
  }

  if (settlement.status !== 'pending') {
    return res.status(400).json({ message: `Settlement is already ${settlement.status}` });
  }

  const before = { status: settlement.status };
  settlement.status = 'confirmed';
  settlement.confirmedAt = new Date();
  await settlement.save();

  await logAudit({
    action: 'settlement.confirm',
    entityType: 'Settlement',
    entityId: settlement._id,
    performedBy: req.user._id,
    group: settlement.group,
    before,
    after: { status: 'confirmed', confirmedAt: settlement.confirmedAt },
  });

  res.json({ settlement });
});

exports.rejectSettlement = asyncHandler(async (req, res) => {
  const settlement = await Settlement.findById(req.params.id);
  if (!settlement) return res.status(404).json({ message: 'Settlement not found' });

  if (!req.group.isMember(req.user._id)) {
    return res.status(403).json({ message: 'Not a member of this group' });
  }

  if (settlement.toUser.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the receiver can reject this settlement' });
  }

  if (settlement.status !== 'pending') {
    return res.status(400).json({ message: `Settlement is already ${settlement.status}` });
  }

  const before = { status: settlement.status };
  settlement.status = 'rejected';
  await settlement.save();

  await logAudit({
    action: 'settlement.reject',
    entityType: 'Settlement',
    entityId: settlement._id,
    performedBy: req.user._id,
    group: settlement.group,
    before,
    after: { status: 'rejected' },
  });

  res.json({ settlement });
});

exports.getSettlements = asyncHandler(async (req, res) => {
  const groupId = req.query.groupId;
  if (!groupId) return res.status(400).json({ message: 'groupId is required' });

  const settlements = await Settlement.find({ group: groupId })
    .populate('fromUser', 'name email avatarUrl')
    .populate('toUser', 'name email avatarUrl')
    .sort({ createdAt: -1 });

  res.json({ settlements });
});
