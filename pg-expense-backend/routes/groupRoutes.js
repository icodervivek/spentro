const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const {
  createGroup,
  getMyGroups,
  getGroup,
  joinGroup,
  updateGroup,
  removeMember,
  leaveGroup,
} = require('../controllers/groupController');
const {
  getGroupBalances,
  getMyBalance,
} = require('../controllers/balanceController');

router.use(protect);

router.post('/', createGroup);
router.get('/', getMyGroups);
router.post('/join', joinGroup);

// Routes that need group membership verification
router.get('/:groupId', requireGroupMember, getGroup);
router.patch('/:groupId', requireGroupMember, updateGroup);
router.delete('/:groupId/members/:userId', requireGroupMember, removeMember);
router.post('/:groupId/leave', requireGroupMember, leaveGroup);

// Balance sub-routes
router.get('/:groupId/balances', requireGroupMember, getGroupBalances);
router.get('/:groupId/balances/me', requireGroupMember, getMyBalance);

module.exports = router;
