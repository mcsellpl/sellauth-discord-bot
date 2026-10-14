const { SlashCommandBuilder } = require('discord.js');
const { claimTicket } = require('../handlers/ticketHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim this ticket as the assigned staff member.'),

  async execute(interaction) {
    const topic = interaction.channel.topic ?? '';
    if (!topic.includes('user:')) {
      return interaction.reply({
        content: '❌ This command can only be used inside a ticket channel.',
        ephemeral: true,
      });
    }
    await claimTicket(interaction);
  },
};
