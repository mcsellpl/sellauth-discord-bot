const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { FLAGS_V2, text, separator, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('paymentsetup')
    .setDescription('Post the accepted payment methods panel in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const allowed =
      interaction.member.roles.cache.some((r) =>
        [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)
      ) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!allowed) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const p = config.payments;
    const methods = p.active
      .map((m) => `${m.emoji} **${m.name}**${m.note ? ` *(${m.note})*` : ''}`)
      .join('\n');
    const now = Math.floor(Date.now() / 1000);

    await interaction.reply({ content: '✅ Payment methods panel posted!', ephemeral: true });
    await interaction.channel.send({
      components: [
        container([
          text(`## ${p.title}`),
          separator(),
          text(`### ✅ Accepted Now\n${methods}`),
          separator(),
          text(`-# ${p.footerText ?? config.botName} • <t:${now}:F>`),
        ], p.color ?? config.botColor),
      ],
      flags: FLAGS_V2,
    });
  },
};
