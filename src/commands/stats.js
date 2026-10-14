const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 View staff performance statistics'),

  async execute(interaction) {
    const isStaff = interaction.member.roles.cache.some((r) =>
      [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)
    );

    if (!isStaff) {
      return interaction.reply({
        content: '❌ Only staff members can view statistics.',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const guild = interaction.guild;
      const channels = await guild.channels.fetch();

      const ticketStats = {};
      let totalTickets = 0;
      let totalClosed = 0;

      for (const [, channel] of channels) {
        if (channel?.type !== ChannelType.GuildText) continue;
        if (!channel.topic?.includes('ticket:')) continue;

        totalTickets++;

        const isClosed = channel.topic.includes('[CLOSED]');
        if (isClosed) {
          totalClosed++;

          const closedByMatch = channel.topic.match(/closedBy:(\d+)/);
          if (closedByMatch) {
            const staffId = closedByMatch[1];
            if (!ticketStats[staffId]) {
              ticketStats[staffId] = { closed: 0, claimed: 0, username: 'Unknown' };
            }
            ticketStats[staffId].closed++;
          }
        }

        const claimedMatch = channel.topic.match(/claimed:(\d+)/);
        if (claimedMatch) {
          const staffId = claimedMatch[1];
          if (!ticketStats[staffId]) {
            ticketStats[staffId] = { closed: 0, claimed: 0, username: 'Unknown' };
          }
          ticketStats[staffId].claimed++;
        }
      }

      for (const staffId of Object.keys(ticketStats)) {
        try {
          const user = await guild.members.fetch(staffId);
          ticketStats[staffId].username = user.user.username;
        } catch (e) {
        }
      }

      const sortedStats = Object.entries(ticketStats)
        .sort((a, b) => b[1].closed - a[1].closed)
        .slice(0, 10);

      const embed = new EmbedBuilder()
        .setColor(config.botColor)
        .setTitle('📊 Support Team Statistics')
        .setDescription(
          `Total Tickets: **${totalTickets}** | Closed: **${totalClosed}**`
        );

      if (sortedStats.length === 0) {
        embed.addFields({
          name: 'No data',
          value: 'No staff activity recorded yet.',
          inline: false,
        });
      } else {
        let statsText = '```\n';
        statsText += 'Staff Member          | Closed | Claimed | Avg Time\n';
        statsText += '─────────────────────────────────────────────\n';

        sortedStats.forEach(([staffId, stats], index) => {
          const userName = stats.username.padEnd(20);
          const closed = String(stats.closed).padEnd(6);
          const claimed = String(stats.claimed).padEnd(8);
          statsText += `${index + 1}. ${userName} | ${closed} | ${claimed} | Tracking...\n`;
        });

        statsText += '```';

        embed.addFields({
          name: '🏆 Top Staff Performance',
          value: statsText,
          inline: false,
        });
      }

      const closedCategory = guild.channels.cache.find(
        (c) => c.id === config.channels.closedCategoryId
      );
      const closedCount = closedCategory
        ? closedCategory.children.cache.size
        : 'Unknown';

      embed.addFields({
        name: '📈 System Stats',
        value: `
Active Tickets: **${totalTickets - totalClosed}**
Total Resolved: **${totalClosed}**
Closed Category: **${closedCount}** tickets
`,
        inline: false,
      });

      embed.setFooter({
        text: `Generated at ${new Date().toLocaleString()}`,
      });

      await interaction.editReply({ embeds: [embed] });

      logger.info(
        `[STATS] ${interaction.user.tag} viewed statistics`
      );
    } catch (error) {
      logger.error(`[STATS] Error: ${error.message}`);

      const errorEmbed = new EmbedBuilder()
        .setColor(config.errorColor)
        .setTitle('❌ Error')
        .setDescription(`Failed to fetch statistics: ${error.message}`);

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
