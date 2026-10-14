const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInvoice } = require('../handlers/sellauthHandler');
const config = require('../../config');
const logger = require('../utils/logger');

function formatMoney(value) {
  const num = Number(value);
  return value != null && value !== '' && Number.isFinite(num) ? num.toString() : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkorder')
    .setDescription('🔍 Check customer order details from Sellauth')
    .addStringOption((option) =>
      option
        .setName('orderid')
        .setDescription('The order ID / invoice number to check')
        .setRequired(true)
    ),

  async execute(interaction) {
    const isStaff = interaction.member.roles.cache.some((r) =>
      [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)
    );

    if (!isStaff) {
      return interaction.reply({
        content: '❌ Only staff members can use this command.',
        ephemeral: true,
      });
    }

    const orderId = interaction.options.getString('orderid').trim();

    await interaction.deferReply();

    try {
      const order = await getInvoice(orderId);

      const embed = new EmbedBuilder()
        .setColor(config.botColor)
        .setTitle(`📦 Order Details`)
        .setDescription(`Order ID: \`${order.id}\``);

      embed.addFields({
        name: '📦 Product',
        value: `${order.product}${order.variant ? ` *(${order.variant})*` : ''}`,
        inline: false,
      });

      if (order.variant) {
        embed.addFields({
          name: '🧩 Variant',
          value: order.variant,
          inline: true,
        });
      }

      const statusMap = {
        paid: '✅ Paid',
        completed: '✅ Completed',
        pending: '⏳ Pending',
        processing: '⏳ Processing',
        cancelled: '❌ Cancelled',
        refunded: '↩️ Refunded',
        failed: '❌ Failed',
        disputed: '⚠️ Disputed',
        chargeback: '⚠️ Chargeback',
      };
      const status = statusMap[(order.status || '').toLowerCase()] || order.status || 'Unknown';

      embed.addFields({
        name: '✅ Status',
        value: status,
        inline: true,
      });

      if (order.quantity) {
        embed.addFields({
          name: '🔢 Quantity',
          value: `${order.quantity}x`,
          inline: true,
        });
      }

      if (order.amount != null) {
        const amountText = formatMoney(order.amount) ?? Number(order.amount).toFixed(2);
        embed.addFields({
          name: '💰 Total Price',
          value: `**${amountText} ${order.currency || 'EUR'}**`,
          inline: true,
        });
      }

      if (order.price != null) {
        embed.addFields({
          name: '🏷️ Invoice Price',
          value: `${formatMoney(order.price) || order.price} ${order.currency || 'EUR'}`,
          inline: true,
        });
      }

      if (order.paid != null) {
        embed.addFields({
          name: '✅ Paid (Invoice)',
          value: `${formatMoney(order.paid) || order.paid} ${order.currency || 'EUR'}`,
          inline: true,
        });
      }

      if (order.paymentAmount != null) {
        const paymentValue = formatMoney(order.paymentAmount) || String(order.paymentAmount);
        const paymentCurrency = order.paymentCurrency || order.customerCurrency || order.currency || 'EUR';
        embed.addFields({
          name: '💳 Payment Amount',
          value: `${paymentValue} ${paymentCurrency}`,
          inline: true,
        });
      }

      if (order.currency || order.customerCurrency) {
        embed.addFields({
          name: '💱 Currency',
          value: [
            order.currency ? `Invoice: ${order.currency}` : null,
            order.customerCurrency ? `Customer: ${order.customerCurrency}` : null,
          ].filter(Boolean).join('\n'),
          inline: true,
        });
      }

      if (order.gateway) {
        embed.addFields({
          name: '💳 Payment Method',
          value: order.gateway.replace(/_/g, ' '),
          inline: true,
        });
      }

      if (order.paymentStatus || order.paymentExternalId) {
        embed.addFields({
          name: '🧾 Payment Details',
          value: [
            order.paymentStatus ? `Status: ${order.paymentStatus}` : null,
            order.paymentExternalId ? `Ref: ${order.paymentExternalId}` : null,
          ].filter(Boolean).join('\n'),
          inline: false,
        });
      }

      if (order.customerName) {
        embed.addFields({
          name: '👤 Customer Name',
          value: order.customerName,
          inline: true,
        });
      }

      if (order.email) {
        embed.addFields({
          name: '📧 Email',
          value: `||${order.email}||`,
          inline: true,
        });
      }

      if (order.discordId) {
        embed.addFields({
          name: '🎮 Discord User',
          value: `<@${order.discordId}>${order.discordUsername ? ` (${order.discordUsername})` : ''}`,
          inline: false,
        });
      } else if (order.discordUsername) {
        embed.addFields({
          name: '🎮 Discord',
          value: order.discordUsername,
          inline: false,
        });
      }

      if (order.createdAt) {
        const d = new Date(order.createdAt);
        const dateStr = isNaN(d) ? order.createdAt : `<t:${Math.floor(d / 1000)}:F>`;
        embed.addFields({
          name: '📅 Order Date',
          value: dateStr,
          inline: true,
        });
      }

      embed.setFooter({
        text: `Checked by ${interaction.user.username} • ${config.botName}`,
        iconURL: interaction.user.avatarURL(),
      });

      await interaction.editReply({ embeds: [embed] });

      logger.info(
        `[CHECKORDER] ${interaction.user.tag} checked order ${orderId}`
      );
    } catch (error) {
      logger.error(`[CHECKORDER] Error: ${error.message}`);

      const errorEmbed = new EmbedBuilder()
        .setColor(config.errorColor)
        .setTitle('❌ Error')
        .setDescription(
          error.message.includes('404')
            ? `Order \`${orderId}\` not found.`
            : `Failed to fetch order: ${error.message}`
        );

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
