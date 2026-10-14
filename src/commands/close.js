const { SlashCommandBuilder } = require('discord.js');
const { promptClose } = require('../handlers/ticketHandler');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close the current ticket.'),

  async execute(interaction) {
    const channel = interaction.channel;
    const topic = channel.topic ?? '';

    if (!topic.includes('user:')) {
      return interaction.reply({
        content: '❌ This command can only be used inside a ticket channel.',
        ephemeral: true,
      });
    }

    const userId = topic.match(/user:(\d+)/)?.[1];
    const isOwner = userId === interaction.user.id;
    const isStaff = interaction.member.roles.cache.some((r) =>
      config.roles.staffRoleIds.includes(r.id)
    );

    if (!isOwner && !isStaff) {
      return interaction.reply({
        content: '❌ Only the ticket owner or staff can close this ticket.',
        ephemeral: true,
      });
    }

    await promptClose(interaction);
  },
};
