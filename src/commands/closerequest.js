const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');
const { FLAGS_V2, text, separator, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('closerequest')
    .setDescription('Request to close the current ticket.'),

  async execute(interaction) {
    const channel = interaction.channel;
    const topic = channel.topic ?? '';

    if (!topic.includes('user:')) {
      return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    if (!interaction.member.roles.cache.some((r) => config.roles.staffRoleIds.includes(r.id))) {
      return interaction.reply({ content: '❌ Only staff members can request to close tickets.', ephemeral: true });
    }

    const userId = topic.match(/user:(\d+)/)?.[1];
    const requestedAt = `<t:${Math.floor(Date.now() / 1000)}:F>`;

    await interaction.deferReply({ ephemeral: true });

    try {
      const owner = await interaction.client.users.fetch(userId);

      const embed = new EmbedBuilder()
        .setTitle('🔒 Ticket Close Request')
        .setDescription('A staff member has requested to close this ticket.')
        .addFields(
          { name: '📝 Staff Member', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: '⏰ Requested at', value: requestedAt, inline: true }
        )
        .setColor(config.warningColor)
        .setFooter({ text: 'Use /close to finalize the closure' });

      const dmEmbed = new EmbedBuilder()
        .setTitle('🔒 Your Ticket Close Request')
        .setDescription(`A staff member has requested to close your ticket: ${channel}`)
        .addFields(
          { name: '📝 Staff Member', value: interaction.user.tag, inline: true },
          { name: '⏰ Requested at', value: requestedAt, inline: true }
        )
        .setColor(config.warningColor)
        .setFooter({ text: 'The staff team will handle the closure shortly' });

      await owner.send({ embeds: [dmEmbed] }).catch((err) => {
        logger.warn(`Could not DM user ${userId}: ${err.message}`);
      });

      await channel.send({ content: `<@${userId}>`, embeds: [embed] });

      const logChannel = await interaction.guild.channels.fetch(config.channels.logChannelId).catch(() => null);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('📋 Ticket Close Request Log')
          .setDescription(`**Channel:** ${channel}\n**Requester:** ${interaction.user.tag}\n**Ticket Owner:** ${owner.tag}`)
          .setColor(config.warningColor)
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }

      await interaction.editReply({
        components: [
          container([
            text('✅ Close request sent'),
            separator(),
            text(`Notified <@${userId}> about the close request.`),
          ], config.successColor),
        ],
        flags: FLAGS_V2,
      });
    } catch (err) {
      logger.error(`Close request error: ${err.message}`);
      await interaction.editReply({ content: `❌ Error sending close request: ${err.message}` });
    }
  },
};
