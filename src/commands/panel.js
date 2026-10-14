const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { sendPanel } = require('../handlers/ticketHandler');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Send the ticket support panel to this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    await interaction.deferReply();

    const hasRole =
      interaction.member.roles.cache.some((r) => [
        ...config.roles.staffRoleIds,
        ...config.roles.adminRoleIds,
      ].includes(r.id)) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!hasRole) {
      return interaction.editReply({
        content: '❌ You do not have permission to use this command.',
      });
    }

    await sendPanel(interaction);
  },
};
