const cron = require('node-cron');
const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');
const logAudit = require('../utils/auditLogger');

/**
 * Advance a nextRunDate based on the template's frequency.
 */
const advanceDate = (date, frequency, dayOfMonth) => {
  const next = new Date(date);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth) {
        next.setDate(Math.min(dayOfMonth, 28)); // cap at 28 to stay safe
      }
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return next;
};

const processRecurringExpenses = async () => {
  const now = new Date();
  console.log(`[RecurringJob] Running at ${now.toISOString()}`);

  let processed = 0;
  let failed = 0;

  try {
    const templates = await RecurringExpense.find({
      isActive: true,
      nextRunDate: { $lte: now },
    });

    console.log(`[RecurringJob] Found ${templates.length} template(s) to process`);

    for (const template of templates) {
      try {
        const expense = await Expense.create({
          group: template.group,
          paidBy: template.paidBy,
          amount: template.amount,
          category: template.category,
          description: template.description,
          splitType: template.splitType,
          splitAmong: template.splitAmong,
          date: now,
          isRecurring: true,
          recurringTemplate: template._id,
        });

        template.nextRunDate = advanceDate(
          template.nextRunDate,
          template.frequency,
          template.dayOfMonth
        );
        await template.save();

        await logAudit({
          action: 'recurring.fire',
          entityType: 'Expense',
          entityId: expense._id,
          performedBy: null, // system action
          group: template.group,
          metadata: {
            templateId: template._id,
            frequency: template.frequency,
            nextRunDate: template.nextRunDate,
          },
        });

        console.log(
          `[RecurringJob] Created expense ${expense._id} from template ${template._id}`
        );
        processed++;
      } catch (err) {
        console.error(
          `[RecurringJob] Failed to process template ${template._id}:`,
          err.message
        );
        failed++;
      }
    }
  } catch (err) {
    console.error('[RecurringJob] Fatal error during processing:', err.message);
  }

  console.log(
    `[RecurringJob] Done. Processed: ${processed}, Failed: ${failed}`
  );
};

/**
 * Start the cron job.
 * Runs daily at 01:00 IST = 19:30 UTC (IST = UTC+5:30).
 * Schedule: '30 19 * * *' in UTC, or use timezone option.
 */
const startRecurringJob = () => {
  // node-cron supports timezone natively
  cron.schedule('0 1 * * *', processRecurringExpenses, {
    timezone: 'Asia/Kolkata',
  });
  console.log('[RecurringJob] Scheduled daily at 01:00 IST');
};

module.exports = { startRecurringJob, processRecurringExpenses };
