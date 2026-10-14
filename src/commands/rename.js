const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { FLAGS_V2, text, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Rename the current ticket channel.')
    .addStringOption((opt) =>
      opt.setName('name').setDescription('New name for the ticket').setRequired(true).setMaxLength(90)
    ),

  async execute(interaction) {
    const channel = interaction.channel;

    if (!(channel.topic ?? '').includes('user:')) {
      return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    if (!interaction.member.roles.cache.some((r) => config.roles.staffRoleIds.includes(r.id))) {
      return interaction.reply({ content: '❌ Only staff can rename tickets.', ephemeral: true });
    }

    const name = interaction.options.getString('name').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    await channel.setName(name);

    await interaction.reply({
      components: [container([text(`✅ Ticket channel renamed to **${name}**.`)], config.successColor)],
      flags: FLAGS_V2,
    });
  },
};
