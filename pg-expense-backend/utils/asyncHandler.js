/**
 * Wraps async route handlers to eliminate try/catch boilerplate.
 * Passes any rejection to Express's next() for the error handler.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
