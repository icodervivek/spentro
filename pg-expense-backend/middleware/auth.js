const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorised — no token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token); // throws on invalid/expired

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ message: 'User no longer exists' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ message: 'Account suspended' });
  }

  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, adminOnly };
