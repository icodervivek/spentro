const AuditLog = require('../models/AuditLog');

/**
 * Write an audit log entry. Never throws — logs error to console on failure.
 *
 * @param {object} params
 * @param {string}   params.action        e.g. 'expense.create'
 * @param {string}   params.entityType    e.g. 'Expense'
 * @param {ObjectId} params.entityId
 * @param {ObjectId} [params.performedBy] null for system actions
 * @param {ObjectId} [params.group]
 * @param {object}   [params.before]      document state before mutation
 * @param {object}   [params.after]       document state after mutation
 * @param {object}   [params.metadata]    extra context
 */
const logAudit = async ({
  action,
  entityType,
  entityId,
  performedBy = null,
  group = null,
  before = null,
  after = null,
  metadata = null,
}) => {
  try {
    await AuditLog.create({
      action,
      entityType,
      entityId,
      performedBy,
      group,
      before,
      after,
      metadata,
    });
  } catch (err) {
    console.error(`[AuditLog] Failed to write audit entry (${action}):`, err.message);
  }
};

module.exports = logAudit;
