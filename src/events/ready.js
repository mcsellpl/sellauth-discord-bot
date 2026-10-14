const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../../config');
const { checkAutoCloseTickets } = require('../handlers/ticketHandler');

async function runAutoClose(client) {
  for (const guild of client.guilds.cache.values()) {
    await checkAutoCloseTickets(guild);
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    logger.success(`Logged in as ${client.user.tag}`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);

    client.user.setPresence({
      activities: [{ name: 'MCSell', type: ActivityType.Streaming, url: 'https://www.twitch.tv/mcsell' }],
      status: 'online',
    });

    if (!config.autoClose?.enabled) return;

    const hours = config.autoClose.checkIntervalHours || 24;
    logger.info(`Auto-close check runs every ${hours}h`);

    setTimeout(() => runAutoClose(client), 10 * 60 * 1000);
    setInterval(() => runAutoClose(client), hours * 60 * 60 * 1000);
  },
};
