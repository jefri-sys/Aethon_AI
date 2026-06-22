const cron = require('node-cron');
const User = require('../models/User');

const startTokenResetJob = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[Cron] Running daily AI token reset job...');
      const result = await User.updateMany({}, { $set: { aiTokensUsed: 0 } });
      console.log(`[Cron] Successfully reset AI tokens for ${result.modifiedCount} users.`);
    } catch (error) {
      console.error('[Cron] Error resetting AI tokens:', error);
    }
  });
};

module.exports = startTokenResetJob;
