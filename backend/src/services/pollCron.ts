import cron from 'node-cron';
import { ensureDailyPoll } from './pollFactory';

export const startPollCron = () => {
  cron.schedule('5 0 * * *', async () => {
    try {
      const poll = await ensureDailyPoll();
      console.log(`Poll diaria preparada: ${poll.id}`);
    } catch (error) {
      console.error('Error creando poll diaria', error);
    }
  });
};
