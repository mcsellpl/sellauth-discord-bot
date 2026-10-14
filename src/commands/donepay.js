const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');
const { FLAGS_V2, text, section, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('donepay')
    .setDescription('Mark a payment ticket as done and move it to the completed category.'),

  async execute(interaction) {
    const channel = interaction.channel;
    const topic = channel.topic ?? '';

    if (!topic.includes('user:') || !topic.includes('payment')) {
      return interaction.reply({ content: '❌ This command can only be used in payment ticket channels.', ephemeral: true });
    }

    const isStaff =
      interaction.member.roles.cache.some((r) =>
        [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)
      ) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!isStaff) {
      return interaction.reply({ content: '❌ Only staff can mark payments as done.', ephemeral: true });
    }

    try {
      await channel.setName('done').catch(() => {});
      await channel.setParent(config.channels.doneCategoryId, { lockPermissions: false }).catch(() => {});

      await interaction.reply({
        components: [
          container([
            section([
              '### ✅ Payment Marked as Done',
              'This channel has been marked as completed and moved to the done category.',
              `-# Marked <t:${Math.floor(Date.now() / 1000)}:R>`,
            ], interaction.user.displayAvatarURL({ size: 64, extension: 'png' })),
          ], config.successColor),
        ],
        flags: FLAGS_V2,
      });

      await interaction.client.channels.cache.get(config.channels.logChannelId)?.send({
        components: [
          container([
            text(`### ✅ Payment Marked as Done\nChannel <#${channel.id}> marked as done by <@${interaction.user.id}>`),
          ], config.successColor),
        ],
        flags: FLAGS_V2,
      }).catch(() => {});
    } catch (err) {
      logger.error(`[DONEPAY] ${err.message}`);
      return interaction.reply({ content: '❌ Failed to mark payment as done.', ephemeral: true });
    }
  },
};
