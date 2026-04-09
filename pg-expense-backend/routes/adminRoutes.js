const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  listUsers,
  updateUserStatus,
  listGroups,
  getGroupDetail,
  analytics,
  getAuditLogs,
} = require('../controllers/adminController');

router.use(protect, adminOnly);

router.get('/users', listUsers);
router.patch('/users/:id/status', updateUserStatus);

router.get('/groups', listGroups);
router.get('/groups/:id', getGroupDetail);

router.get('/analytics', analytics);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
