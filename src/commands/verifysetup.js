const { SlashCommandBuilder, PermissionFlagsBits, ButtonStyle } = require('discord.js');
const config = require('../../config');
const logger = require('../utils/logger');
const { FLAGS_V2, text, separator, section, container, button, row } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verifysetup')
    .setDescription('Post the verification panel in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const allowed =
      interaction.member.roles.cache.some((r) =>
        [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)
      ) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!allowed) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const v = config.verify;
    const now = Math.floor(Date.now() / 1000);

    const children = v.thumbnailUrl
      ? [section([`## ${v.title}`, v.description], v.thumbnailUrl)]
      : [text(`## ${v.title}`), text(v.description)];

    children.push(
      separator(),
      text(`-# ${v.footerText ?? config.botName} • <t:${now}:F>`),
      row(button('verify_button', v.buttonLabel ?? 'Verify', ButtonStyle.Primary, v.buttonEmoji))
    );

    try {
      await interaction.channel.send({
        components: [container(children, v.color ?? config.botColor)],
        flags: FLAGS_V2,
      });
      await interaction.reply({ content: '✅ Verification panel posted!', ephemeral: true });
    } catch (err) {
      logger.error(`[VERIFYSETUP] ${err.message}`);
      await interaction.reply({ content: '❌ Failed to post verification panel!', ephemeral: true });
    }
  },
};
