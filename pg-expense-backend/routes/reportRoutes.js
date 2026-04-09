const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const { monthlyReport, categoryReport } = require('../controllers/reportController');

router.use(protect);

// groupId comes from query string for both routes
router.get('/monthly', (req, res, next) => {
  req.params.groupId = req.query.groupId;
  next();
}, requireGroupMember, monthlyReport);

router.get('/category', (req, res, next) => {
  req.params.groupId = req.query.groupId;
  next();
}, requireGroupMember, categoryReport);

module.exports = router;
