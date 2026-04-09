const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { updateMe, changePassword } = require('../controllers/userController');

router.use(protect);

router.patch('/me', upload.single('avatar'), updateMe);
router.patch('/me/password', changePassword);

module.exports = router;
