const Joi = require('joi');
const RecurringExpense = require('../models/RecurringExpense');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');
const { splitEqually } = require('../utils/balanceCalculator');

// ─── Validation schemas ───────────────────────────────────────────────────────

const createRecurringSchema = Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  paidBy: Joi.string().hex().length(24).optional(),
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
  frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
  dayOfMonth: Joi.number().integer().min(1).max(28).when('frequency', {
    is: 'monthly',
    then: Joi.required(),
    otherwise: Joi.optional().allow(null),
  }),
  nextRunDate: Joi.date().iso().required(),
});

const updateRecurringSchema = Joi.object({
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
  frequency: Joi.string().valid('daily', 'weekly', 'monthly'),
  dayOfMonth: Joi.number().integer().min(1).max(28).allow(null),
  nextRunDate: Joi.date().iso(),
  isActive: Joi.boolean(),
}).min(1);

// ─── Controllers ──────────────────────────────────────────────────────────────

exports.createRecurring = asyncHandler(async (req, res) => {
  const { error, value } = createRecurringSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const group = req.group;
  const memberIds = group.members.map((m) => m.user.toString());

  let { groupId, paidBy, amount, category, description, splitType, splitAmong, frequency, dayOfMonth, nextRunDate } = value;
  paidBy = paidBy || req.user._id.toString();

  if (!memberIds.includes(paidBy)) {
    return res.status(400).json({ message: 'paidBy user is not a group member' });
  }

  if (!splitAmong || splitAmong.length === 0) {
    splitAmong = splitEqually(amount, memberIds);
  }

  const template = await RecurringExpense.create({
    group: groupId,
    createdBy: req.user._id,
    paidBy,
    amount,
    category: category || 'other',
    description: description || null,
    splitType: splitType || 'equal',
    splitAmong,
    frequency,
    dayOfMonth: dayOfMonth || null,
    nextRunDate,
  });

  await logAudit({
    action: 'recurring.create',
    entityType: 'RecurringExpense',
    entityId: template._id,
    performedBy: req.user._id,
    group: groupId,
    after: { amount, frequency, nextRunDate },
  });

  res.status(201).json({ template });
});

exports.getRecurring = asyncHandler(async (req, res) => {
  const { groupId } = req.query;
  if (!groupId) return res.status(400).json({ message: 'groupId is required' });

  const templates = await RecurringExpense.find({ group: groupId })
    .populate('paidBy', 'name email avatarUrl')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({ templates });
});

exports.updateRecurring = asyncHandler(async (req, res) => {
  const { error, value } = updateRecurringSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const template = await RecurringExpense.findOne({
    _id: req.params.id,
    group: req.group._id,
  });
  if (!template) return res.status(404).json({ message: 'Recurring expense template not found' });

  const isGroupAdmin = req.group.isGroupAdmin(req.user._id);
  const isCreator = template.createdBy.toString() === req.user._id.toString();
  if (!isGroupAdmin && !isCreator) {
    return res.status(403).json({ message: 'Only the creator or a group admin can update this template' });
  }

  const allowedFields = ['amount', 'category', 'description', 'splitType', 'splitAmong', 'frequency', 'dayOfMonth', 'nextRunDate', 'isActive'];
  allowedFields.forEach((f) => {
    if (value[f] !== undefined) template[f] = value[f];
  });
  await template.save();

  res.json({ template });
});

exports.deleteRecurring = asyncHandler(async (req, res) => {
  const template = await RecurringExpense.findOne({
    _id: req.params.id,
    group: req.group._id,
  });
  if (!template) return res.status(404).json({ message: 'Recurring expense template not found' });

  const isGroupAdmin = req.group.isGroupAdmin(req.user._id);
  const isCreator = template.createdBy.toString() === req.user._id.toString();
  if (!isGroupAdmin && !isCreator) {
    return res.status(403).json({ message: 'Only the creator or a group admin can deactivate this template' });
  }

  template.isActive = false;
  await template.save();

  await logAudit({
    action: 'recurring.deactivate',
    entityType: 'RecurringExpense',
    entityId: template._id,
    performedBy: req.user._id,
    group: template.group,
  });

  res.json({ message: 'Recurring expense deactivated', template });
});
