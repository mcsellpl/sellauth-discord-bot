const { SlashCommandBuilder } = require('discord.js');
const { manualTranscript } = require('../handlers/ticketHandler');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('Save a transcript of this ticket to the transcript channel.'),

  async execute(interaction) {
    const topic = interaction.channel.topic ?? '';
    if (!topic.includes('user:')) {
      return interaction.reply({
        content: '❌ This command can only be used inside a ticket channel.',
        ephemeral: true,
      });
    }

    const isStaff = interaction.member.roles.cache.some((r) =>
      config.roles.staffRoleIds.includes(r.id)
    );

    if (!isStaff) {
      return interaction.reply({ content: '❌ Only staff can generate transcripts.', ephemeral: true });
    }

    await manualTranscript(interaction);
  },
};
