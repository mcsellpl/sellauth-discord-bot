const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { FLAGS_V2, text, separator, container } = require('../utils/components');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('paypal')
    .setDescription('Show PayPal payment information.'),

  async execute(interaction) {
    const allowed =
      interaction.member.roles.cache.some((r) =>
        [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)
      ) || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!allowed) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const now = Math.floor(Date.now() / 1000);

    await interaction.reply({ content: '✅ PayPal information posted!', ephemeral: true });
    await interaction.channel.send({
      components: [
        container([
          text('## 💳 PayPal Payment Information'),
          separator(),
          text(`**PayPal Email:**\n||${config.payments.paypalEmail}||`),
          separator(),
          text('**Payment Terms:**\n• Only Friends & Family\n• No Notes\n• Pay in EUR'),
          separator(),
          text(`-# ${config.botName} • <t:${now}:F>`),
        ], config.payments.color ?? config.botColor),
      ],
      flags: FLAGS_V2,
    });
  },
};
