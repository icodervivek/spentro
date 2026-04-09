const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/groupAccess');
const { upload } = require('../config/cloudinary');
const {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');

router.use(protect);

// POST requires group membership; groupId comes from body
router.post('/', upload.single('billImage'), requireGroupMember, createExpense);

// GET list — groupId from query
router.get('/', (req, res, next) => {
  req.params.groupId = req.query.groupId || req.query.groupid;
  next();
}, requireGroupMember, getExpenses);

// Single expense routes — groupId resolved via expense document inside controller
// We still need group membership; attach groupId from query param for the middleware
router.get('/:id', (req, res, next) => {
  req.params.groupId = req.query.groupId || req.query.groupid;
  next();
}, requireGroupMember, getExpense);

router.patch('/:id', (req, res, next) => {
  req.params.groupId =
    req.body.groupId || req.body.groupid || req.query.groupId || req.query.groupid;
  next();
}, requireGroupMember, upload.single('billImage'), updateExpense);

router.delete('/:id', (req, res, next) => {
  req.params.groupId =
    req.body.groupId || req.body.groupid || req.query.groupId || req.query.groupid;
  next();
}, requireGroupMember, deleteExpense);

module.exports = router;
