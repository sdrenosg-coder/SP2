import cron from 'node-cron';
import { runReminderChecks } from './reminders.js';
import { runWaitlistExpiry } from './waitlistExpiry.js';
import { runRebookNudges } from './rebookNudges.js';
import { runWeeklyInsights } from './weeklyInsights.js';

export function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await runReminderChecks();
      await runWaitlistExpiry();
      await runRebookNudges();
    } catch (err) { console.error('Scheduler error:', err); }
  });
  cron.schedule('0 9 * * 1', async () => {
    try { await runWeeklyInsights(); } catch (err) { console.error('Weekly insights error:', err); }
  });
  console.log('Scheduler started');
}
