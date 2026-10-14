const { Events } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    const { enabled, roleIds } = config.autorole;

    if (!enabled || !roleIds?.length) return;

    const failed = [];

    for (const roleId of roleIds) {
      const role = member.guild.roles.cache.get(roleId);

      if (!role) {
        logger.warn(`Autorole: Role ${roleId} not found in guild skipping.`);
        failed.push(roleId);
        continue;
      }

      await member.roles.add(role).catch((err) => {
        logger.error(`Autorole: Failed to assign role ${role.name} to ${member.user.tag} ${err.message}`);
        failed.push(roleId);
      });
    }

    const assigned = roleIds.length - failed.length;
    if (assigned > 0) {
      logger.info(`Autorole: Assigned ${assigned} role(s) to ${member.user.tag}`);
    }
  },
};
