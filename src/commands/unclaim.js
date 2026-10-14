const { SlashCommandBuilder } = require('discord.js');
const { unclaimTicket } = require('../handlers/ticketHandler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unclaim')
    .setDescription('Unclaim this ticket so another staff member can take over.'),

  async execute(interaction) {
    const topic = interaction.channel.topic ?? '';
    if (!topic.includes('user:')) {
      return interaction.reply({
        content: '❌ This command can only be used inside a ticket channel.',
        ephemeral: true,
      });
    }
    await unclaimTicket(interaction);
  },
};
