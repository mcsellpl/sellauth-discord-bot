const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { FLAGS_V2, text, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to the current ticket.')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('The user to add').setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.channel;
    const topic = channel.topic ?? '';

    if (!topic.includes('user:')) {
      return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    const isStaff = interaction.member.roles.cache.some((r) => config.roles.staffRoleIds.includes(r.id));
    const isOwner = topic.match(/user:(\d+)/)?.[1] === interaction.user.id;

    if (!isStaff && !isOwner) {
      return interaction.reply({ content: '❌ Only staff or the ticket owner can add users.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');

    await channel.permissionOverwrites.create(target.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
    });

    await interaction.reply({
      components: [container([text(`✅ <@${target.id}> has been added to this ticket.`)], config.successColor)],
      flags: FLAGS_V2,
    });
  },
};
