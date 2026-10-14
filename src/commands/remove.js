const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { FLAGS_V2, text, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user from the current ticket.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The user to remove').setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.channel;
    const topic = channel.topic ?? '';

    if (!topic.includes('user:')) {
      return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    if (!interaction.member.roles.cache.some((r) => config.roles.staffRoleIds.includes(r.id))) {
      return interaction.reply({ content: '❌ Only staff can remove users.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');
    const ownerId = topic.match(/user:(\d+)/)?.[1];

    if (target.id === ownerId) {
      return interaction.reply({
        content: "❌ You can't remove the ticket owner. Close the ticket instead.",
        ephemeral: true,
      });
    }

    await channel.permissionOverwrites.delete(target.id);

    await interaction.reply({
      components: [container([text(`✅ <@${target.id}> has been removed from this ticket.`)], config.successColor)],
      flags: FLAGS_V2,
    });
  },
};
