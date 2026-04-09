/**
 * Joi validation middleware factory.
 * Usage: router.post('/', validate(schema), controller)
 *
 * Validates req.body and returns 400 with a descriptive error on failure.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message).join('; ');
    return res.status(400).json({ message: details });
  }
  next();
};

module.exports = validate;
