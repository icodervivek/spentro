const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const {
  createSettlement,
  confirmSettlement,
  rejectSettlement,
  getSettlements,
} = require('../controllers/settlementController');

router.use(protect);

// POST /settlements — groupId in body
router.post('/', requireGroupMember, createSettlement);

// GET /settlements?groupId=
router.get('/', (req, res, next) => {
  req.params.groupId = req.query.groupId;
  next();
}, requireGroupMember, getSettlements);

// PATCH /settlements/:id/confirm|reject — groupId in body or query
router.patch('/:id/confirm', (req, res, next) => {
  req.params.groupId = req.body.groupId || req.query.groupId;
  next();
}, requireGroupMember, confirmSettlement);

router.patch('/:id/reject', (req, res, next) => {
  req.params.groupId = req.body.groupId || req.query.groupId;
  next();
}, requireGroupMember, rejectSettlement);

module.exports = router;
