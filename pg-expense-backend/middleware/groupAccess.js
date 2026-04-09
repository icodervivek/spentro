const Group = require('../models/Group');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verifies the authenticated user is a member of the group identified by
 * req.params.groupId or req.body.groupId or req.query.groupId.
 *
 * Attaches req.group for downstream controllers to use.
 */
const requireGroupMember = asyncHandler(async (req, res, next) => {
  const groupId =
    req.params.groupId ||
    req.body.groupId ||
    req.query.groupId ||
    req.params.groupid ||
    req.body.groupid ||
    req.query.groupid;

  if (!groupId) {
    return res.status(400).json({ message: 'groupId is required' });
  }

  const group = await Group.findById(groupId);
  if (!group || !group.isActive) {
    return res.status(404).json({ message: 'Group not found' });
  }

  if (!group.isMember(req.user._id)) {
    return res.status(403).json({ message: 'You are not a member of this group' });
  }

  req.group = group;
  next();
});

module.exports = { requireGroupMember };
