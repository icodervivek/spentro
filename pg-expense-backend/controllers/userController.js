const Joi = require('joi');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// ─── Validation schemas ──────────────────────────────────────────────────────

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  phone: Joi.string().trim().max(20).allow(null, ''),
  // avatarUrl accepted as a URL string when no file is uploaded
  avatarUrl: Joi.string().uri().allow(null, ''),
  fcmToken: Joi.string().allow(null, ''),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

exports.updateMe = asyncHandler(async (req, res) => {
  // Validate text fields (skip avatarUrl if a file was uploaded)
  const bodyToValidate = { ...req.body };
  if (req.file) delete bodyToValidate.avatarUrl;

  if (Object.keys(bodyToValidate).length > 0) {
    const { error } = updateProfileSchema.validate(bodyToValidate, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
    }
  }

  const updates = {};

  // Text fields
  ['name', 'phone', 'fcmToken'].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // Avatar: file upload takes priority over URL string
  if (req.file) {
    updates.avatarUrl = req.file.path; // Cloudinary secure URL
  } else if (req.body.avatarUrl !== undefined) {
    updates.avatarUrl = req.body.avatarUrl;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No fields provided to update' });
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { error } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: error.details.map((d) => d.message).join('; ') });
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password updated successfully' });
});
