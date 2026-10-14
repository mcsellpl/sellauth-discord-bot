const chalk = require('chalk');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config');

const timestamp = () => new Date().toLocaleTimeString('en-US', { hour12: false });

const logger = {
  info: (msg) => console.log(chalk.cyan(`[${timestamp()}] [INFO]`) + ` ${msg}`),
  success: (msg) => console.log(chalk.green(`[${timestamp()}] [SUCCESS]`) + ` ${msg}`),
  warn: (msg) => console.log(chalk.yellow(`[${timestamp()}] [WARN]`) + ` ${msg}`),
  error: (msg) => console.log(chalk.red(`[${timestamp()}] [ERROR]`) + ` ${msg}`),
  ticket: (msg) => console.log(chalk.magenta(`[${timestamp()}] [TICKET]`) + ` ${msg}`),

  async toDiscord(client, { title, description, color, fields = [] }) {
    try {
      const ch = await client.channels.fetch(config.channels.logChannelId).catch(() => null);
      if (!ch) return;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color ?? config.botColor)
        .setTimestamp()
        .setFooter({ text: config.botName });

      if (fields.length) embed.addFields(fields);

      await ch.send({ embeds: [embed] });
    } catch {
    }
  },
};

module.exports = logger;
