const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const {
  createRecurring,
  getRecurring,
  updateRecurring,
  deleteRecurring,
} = require('../controllers/recurringController');

router.use(protect);

router.post('/', requireGroupMember, createRecurring);

router.get('/', (req, res, next) => {
  req.params.groupId = req.query.groupId;
  next();
}, requireGroupMember, getRecurring);

router.patch('/:id', (req, res, next) => {
  req.params.groupId = req.body.groupId || req.query.groupId;
  next();
}, requireGroupMember, updateRecurring);

router.delete('/:id', (req, res, next) => {
  req.params.groupId = req.body.groupId || req.query.groupId;
  next();
}, requireGroupMember, deleteRecurring);

module.exports = router;
