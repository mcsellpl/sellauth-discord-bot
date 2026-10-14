const { Events, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const w = config.welcome;
    if (!w?.enabled) return;

    const channel = member.guild.channels.cache.get(w.channelId);
    if (!channel) {
      logger.warn(`Welcome: Channel ${w.channelId} not found skipping.`);
      return;
    }

    const guild = member.guild;
    const user = member.user;
    const memberCount = guild.memberCount;

    const resolve = (str) =>
      str
        .replace(/{user}/g, `<@${user.id}>`)
        .replace(/{username}/g, user.tag)
        .replace(/{server}/g, guild.name)
        .replace(/{memberCount}/g, memberCount.toLocaleString('en-US'));

    const embed = new EmbedBuilder()
      .setTitle(resolve(w.title))
      .setDescription(resolve(w.description))
      .setColor(w.color ?? config.botColor)
      .setFooter({ text: resolve(w.footerText ?? guild.name) })
      .setTimestamp();

    if (w.showAvatar) {
      embed.setThumbnail(user.displayAvatarURL({ extension: 'png', size: 256 }));
    }

    if (w.imageUrl) {
      embed.setImage(w.imageUrl);
    }

    const content = w.pingUser ? `<@${user.id}>` : undefined;

    await channel.send({ content, embeds: [embed] }).catch((err) => {
      logger.error(`Welcome: Failed to send message ${err.message}`);
    });

    logger.info(`Welcome: Sent welcome message for ${user.tag} (Member #${memberCount})`);
  },
};
