const Joi = require('joi');
const Group = require('../models/Group');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logAudit = require('../utils/auditLogger');

// ─── Validation schemas ──────────────────────────────────────────────────────

const createGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow(null, ''),
  address: Joi.string().trim().max(300).allow(null, ''),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow(null, ''),
  address: Joi.string().trim().max(300).allow(null, ''),
}).min(1);

const joinGroupSchema = Joi.object({
  inviteCode: Joi.string().length(8).uppercase().required(),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

exports.createGroup = asyncHandler(async (req, res) => {
  const { error } = createGroupSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const { name, description, address } = req.body;

  const group = await Group.create({
    name,
    description: description || null,
    address: address || null,
    createdBy: req.user._id,
    members: [{ user: req.user._id, isAdmin: true, joinedAt: new Date() }],
  });

  // Add group to user's groups array
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });

  await logAudit({
    action: 'group.create',
    entityType: 'Group',
    entityId: group._id,
    performedBy: req.user._id,
    group: group._id,
    after: { name: group.name, inviteCode: group.inviteCode },
  });

  res.status(201).json({ group });
});

exports.getMyGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({
    'members.user': req.user._id,
    isActive: true,
  })
    .populate('members.user', 'name email avatarUrl')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.json({ groups });
});

exports.getGroup = asyncHandler(async (req, res) => {
  // req.group is attached by requireGroupMember middleware
  const group = await Group.findById(req.group._id)
    .populate('members.user', 'name email avatarUrl phone')
    .populate('createdBy', 'name email');

  res.json({ group });
});

exports.joinGroup = asyncHandler(async (req, res) => {
  const { error } = joinGroupSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const { inviteCode } = req.body;

  const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });
  if (!group) {
    return res.status(404).json({ message: 'Invalid invite code' });
  }

  if (group.isMember(req.user._id)) {
    return res.status(409).json({ message: 'You are already a member of this group' });
  }

  group.members.push({ user: req.user._id, isAdmin: false, joinedAt: new Date() });
  await group.save();

  await User.findByIdAndUpdate(req.user._id, { $addToSet: { groups: group._id } });

  await logAudit({
    action: 'group.member.join',
    entityType: 'Group',
    entityId: group._id,
    performedBy: req.user._id,
    group: group._id,
    metadata: { joinedUserId: req.user._id },
  });

  res.json({ message: 'Joined group successfully', group });
});

exports.updateGroup = asyncHandler(async (req, res) => {
  const { error } = updateGroupSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const group = req.group;

  if (!group.isGroupAdmin(req.user._id)) {
    return res.status(403).json({ message: 'Only group admins can update group details' });
  }

  const before = { name: group.name, description: group.description, address: group.address };
  const allowedFields = ['name', 'description', 'address'];
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) group[f] = req.body[f];
  });
  await group.save();

  await logAudit({
    action: 'group.update',
    entityType: 'Group',
    entityId: group._id,
    performedBy: req.user._id,
    group: group._id,
    before,
    after: { name: group.name, description: group.description, address: group.address },
  });

  res.json({ group });
});

exports.removeMember = asyncHandler(async (req, res) => {
  const { groupId, userId } = req.params;
  const group = req.group;
  const requesterId = req.user._id.toString();

  const isAdmin = group.isGroupAdmin(requesterId);
  const isSelf = requesterId === userId;

  if (!isAdmin && !isSelf) {
    return res.status(403).json({ message: 'Only group admins can remove other members' });
  }

  const memberIndex = group.members.findIndex((m) => m.user.toString() === userId);
  if (memberIndex === -1) {
    return res.status(404).json({ message: 'User is not a member of this group' });
  }

  // Prevent removing the last admin
  const admins = group.members.filter((m) => m.isAdmin);
  const targetIsAdmin = group.members[memberIndex].isAdmin;
  if (targetIsAdmin && admins.length === 1) {
    return res.status(400).json({ message: 'Cannot remove the only group admin' });
  }

  group.members.splice(memberIndex, 1);
  await group.save();

  await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });

  await logAudit({
    action: 'group.member.remove',
    entityType: 'Group',
    entityId: group._id,
    performedBy: req.user._id,
    group: group._id,
    metadata: { removedUserId: userId },
  });

  res.json({ message: 'Member removed successfully' });
});

exports.leaveGroup = asyncHandler(async (req, res) => {
  const group = req.group;
  const userId = req.user._id.toString();

  const memberIndex = group.members.findIndex((m) => m.user.toString() === userId);
  if (memberIndex === -1) {
    return res.status(404).json({ message: 'You are not a member of this group' });
  }

  const admins = group.members.filter((m) => m.isAdmin);
  const isLastAdmin =
    group.members[memberIndex].isAdmin && admins.length === 1 && group.members.length > 1;

  if (isLastAdmin) {
    return res
      .status(400)
      .json({ message: 'Assign another admin before leaving the group' });
  }

  group.members.splice(memberIndex, 1);

  // If last member leaves, deactivate the group
  if (group.members.length === 0) {
    group.isActive = false;
  }

  await group.save();
  await User.findByIdAndUpdate(userId, { $pull: { groups: group._id } });

  await logAudit({
    action: 'group.member.leave',
    entityType: 'Group',
    entityId: group._id,
    performedBy: req.user._id,
    group: group._id,
    metadata: { leftUserId: userId },
  });

  res.json({ message: 'Left group successfully' });
});
