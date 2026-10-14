const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');
const { FLAGS_V2, text, section, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givecustomer')
    .setDescription('Give a user the customer role.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The user to give the role to').setRequired(true)
    ),

  async execute(interaction) {
    const isStaff =
      interaction.member.roles.cache.some((r) =>
        [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)
      ) || interaction.member.permissions.has(PermissionFlagsBits.ManageRoles);

    if (!isStaff) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const roleId = config.roles.customerRoleId;
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Could not find this user in the server.', ephemeral: true });
    }

    try {
      const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
      if (!role) {
        return interaction.reply({ content: '❌ Customer role not found.', ephemeral: true });
      }

      if (member.roles.cache.has(roleId)) {
        return interaction.reply({ content: `⚠️ <@${user.id}> already has the customer role.`, ephemeral: true });
      }

      await member.roles.add(roleId);

      await interaction.reply({
        components: [
          container([
            section([
              '### ✅ Role Assigned',
              `**<@${user.id}>** has been given the <@&${roleId}> role.`,
              `-# Assigned <t:${Math.floor(Date.now() / 1000)}:R>`,
            ], user.displayAvatarURL({ size: 64, extension: 'png' })),
          ], config.successColor),
        ],
        flags: FLAGS_V2,
      });

      await interaction.client.channels.cache.get(config.channels.logChannelId)?.send({
        components: [
          container([
            text(`### 👤 Customer Role Assigned\n<@${user.id}> received the customer role from <@${interaction.user.id}>`),
          ], config.successColor),
        ],
        flags: FLAGS_V2,
      }).catch(() => {});
    } catch (err) {
      logger.error(`[GIVECUSTOMER] ${err.message}`);
      return interaction.reply({ content: '❌ Failed to assign role.', ephemeral: true });
    }
  },
};
