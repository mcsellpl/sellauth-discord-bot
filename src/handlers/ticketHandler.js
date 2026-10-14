const {
  ChannelType,
  ComponentType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const config = require('../../config');
const logger = require('../utils/logger');
const { getInvoice } = require('./sellauthHandler');
const { generateTranscript } = require('../utils/transcript');
const { FLAGS_V2, text, separator, section, container, button, row } = require('../utils/components');

const VERIFIED_FILE = path.join(__dirname, '../../data/verified_users.json');

function ticketButtons(claimedById) {
  return row(
    button('ticket_close', 'Close Ticket', ButtonStyle.Danger, '🔒'),
    claimedById
      ? button('ticket_unclaim', 'Unclaim', ButtonStyle.Secondary, '🔓')
      : button('ticket_claim', 'Claim Ticket', ButtonStyle.Primary, '🙋'),
    button('ticket_transcript', 'Transcript', ButtonStyle.Secondary, '📄')
  );
}

function closeConfirmButtons() {
  return row(
    button('ticket_close_confirm', 'Confirm Close', ButtonStyle.Danger, '✅'),
    button('ticket_close_cancel', 'Cancel', ButtonStyle.Secondary, '✖️')
  );
}

function editReplyV2(interaction, children, color) {
  return interaction.editReply({ components: [container(children, color)], flags: FLAGS_V2 });
}

function updateV2(interaction, children, color) {
  return interaction.update({ components: [container(children, color)], flags: FLAGS_V2 });
}

async function countUserTickets(guild, userId) {
  const channels = await guild.channels.fetch();
  return channels.filter(
    (ch) => ch?.type === ChannelType.GuildText && ch.topic?.includes(`user:${userId}`)
  ).size;
}

async function findExistingTicket(guild, userId, categoryId) {
  const channels = await guild.channels.fetch();
  return channels.find(
    (ch) =>
      ch?.type === ChannelType.GuildText &&
      ch.topic?.includes(`user:${userId}`) &&
      ch.topic?.includes(`category:${categoryId}`)
  );
}

function resolveParentId(cat) {
  return cat.categoryChannelId ?? config.channels.defaultTicketCategoryId ?? null;
}
function resolveStaffRoles(cat) {
  return cat.staffRoleId ? [cat.staffRoleId] : config.roles.staffRoleIds ?? [];
}
function getClaimedById(topic) {
  return topic?.match(/claimed:(\d+)/)?.[1] ?? null;
}
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function formatStatus(status) {
  const map = {
    paid: '✅ Paid', completed: '✅ Completed',
    pending: '⏳ Pending', processing: '⏳ Processing',
    cancelled: '❌ Cancelled', canceled: '❌ Cancelled',
    refunded: '↩️ Refunded', failed: '❌ Failed',
    disputed: '⚠️ Disputed', chargeback: '⚠️ Chargeback',
  };
  return map[(status || '').toLowerCase()] || capitalizeFirst(status);
}

function buildOrderText(order) {
  const lines = [
    `🆔 **Order ID:** \`${order.id}\``,
    `📦 **Product:** ${order.product}${order.variant ? ` *(${order.variant})*` : ''}`,
    `💰 **Amount:** ${order.amount != null ? `**${parseFloat(order.amount).toFixed(2)} ${order.currency}**` : 'N/A'}`,
    `✅ **Status:** ${formatStatus(order.status)}`,
  ];
  if (order.quantity > 1)  lines.push(`🔢 **Quantity:** ${order.quantity}x`);
  if (order.gateway)       lines.push(`💳 **Payment:** ${capitalizeFirst(order.gateway.replace(/_/g, ' '))}`);
  if (order.customerName)  lines.push(`👤 **Customer:** ${order.customerName}`);
  if (order.email)         lines.push(`📧 **Email:** ||${order.email}||`);
  if (order.discordId) {
    lines.push(`🎮 **Discord:** <@${order.discordId}>${order.discordUsername ? ` *(${order.discordUsername})*` : ''}`);
  } else if (order.discordUsername) {
    lines.push(`🎮 **Discord:** ${order.discordUsername}`);
  }
  if (order.createdAt) {
    const d = new Date(order.createdAt);
    lines.push(`📅 **Order Date:** ${isNaN(d) ? order.createdAt : `<t:${Math.floor(d / 1000)}:F>`}`);
  }
  return lines.join('\n');
}

async function sendPanel(interaction) {
  const p = config.panel;
  const now = Math.floor(Date.now() / 1000);
  const roles = interaction.member.roles.cache;
  const isAdmin = roles.some((r) => config.roles.adminRoleIds.includes(r.id));

  const categories = isAdmin
    ? config.categories
    : config.categories.filter((cat) => {
        const required = cat.requiredRoleIds || [];
        return required.length === 0 || roles.some((r) => required.includes(r.id));
      });

  const children = p.thumbnailUrl
    ? [section([`## ${p.title}`, p.description], p.thumbnailUrl)]
    : [text(`## ${p.title}`), text(p.description)];

  children.push(
    separator(),
    text(categories.map((cat) => `${cat.emoji} **${cat.label}**`).join('\n')),
    separator(2),
    text(`⚠️ **${p.footerText}**`),
    separator(),
    text(`<t:${now}:F>`),
    row({
      type: ComponentType.StringSelect,
      custom_id: 'ticket_category_select',
      placeholder: p.placeholder,
      options: categories.map((cat) => ({
        value: cat.id,
        label: cat.label,
        description: cat.description,
        emoji: { name: cat.emoji },
      })),
    })
  );

  await interaction.editReply({ components: [container(children, config.botColor)], flags: FLAGS_V2 });
}

async function handleCategorySelect(interaction) {
  const categoryId = interaction.values[0];
  const category = config.categories.find((c) => c.id === categoryId);
  if (!category) return interaction.reply({ content: '❌ Unknown category.', ephemeral: true });

  if (category.requiresOrderVerification) {
    const modal = new ModalBuilder()
      .setCustomId(`ticket_order_modal:${categoryId}`)
      .setTitle('Order Verification');
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('order_id')
          .setLabel('Your Order ID / Invoice Number')
          .setPlaceholder('e.g. INV-12345')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      )
    );
    return interaction.showModal(modal);
  }

  await interaction.deferReply({ ephemeral: true });

  const openCount = await countUserTickets(interaction.guild, interaction.user.id);
  if (openCount >= config.tickets.maxOpenPerUser) {
    return interaction.editReply({
      content: `❌ You already have **${openCount}** open ticket(s). Please close it first.`,
    });
  }

  const existing = await findExistingTicket(interaction.guild, interaction.user.id, category.id);
  if (existing) {
    return interaction.editReply({
      content: `❌ You already have an open **${category.label}** ticket: ${existing}`,
    });
  }

  await createTicket(interaction, category, null);
}

async function handleOrderModal(interaction, categoryId) {
  const category = config.categories.find((c) => c.id === categoryId);
  if (!category) return interaction.reply({ content: '❌ Unknown category.', ephemeral: true });

  const orderId = interaction.fields.getTextInputValue('order_id').trim();

  await interaction.deferReply({ ephemeral: true });

  const openCount = await countUserTickets(interaction.guild, interaction.user.id);
  if (openCount >= config.tickets.maxOpenPerUser) {
    return editReplyV2(interaction,
      [text(`❌ You already have **${openCount}** open ticket(s). Please close it first.`)],
      config.warningColor
    );
  }

  const existing = await findExistingTicket(interaction.guild, interaction.user.id, category.id);
  if (existing) {
    return editReplyV2(interaction,
      [text(`❌ You already have an open **${category.label}** ticket: ${existing}`)],
      config.warningColor
    );
  }

  let order = null;
  try {
    order = await getInvoice(orderId);
  } catch (err) {
    logger.error(`Sellauth lookup failed for ${orderId}: ${err.message}`);
    if (err.response?.data) {
      logger.warn(`Sellauth raw: ${JSON.stringify(err.response.data).slice(0, 500)}`);
    }
    const isNotFound = err.response?.status === 404;
    return editReplyV2(interaction, [
      text('## ❌ Order Not Found'),
      separator(),
      text(isNotFound
        ? `No order found for \`${orderId}\`. Please double-check and try again.`
        : `Something went wrong verifying your order.\n\`\`\`${err.message}\`\`\``
      ),
    ], config.errorColor);
  }

  if (order) {
    trackVerifiedUser(interaction.user.id, order.id);
  }

  await createTicket(interaction, category, order);
}

async function createTicket(interaction, category, order) {
  const guild = interaction.guild;
  const user  = interaction.user;

  const accessRoleIds = (category.requiredRoleIds && category.requiredRoleIds.length > 0) 
    ? category.requiredRoleIds 
    : resolveStaffRoles(category);
  
  const parentId     = resolveParentId(category);
  const safeName     = user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
  const channelName  = `${category.channelPrefix}-${safeName}`;

  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages, PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    ...accessRoleIds.map((id) => ({
      id,
      allow: [
        PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks,
      ],
    })),
  ];

  let ticketChannel;
  try {
    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parentId ?? undefined,
      topic: `user:${user.id} | category:${category.id} | opened:<t:${Math.floor(Date.now() / 1000)}:F>`,
      permissionOverwrites: overwrites,
    });
  } catch (err) {
    logger.error(`Failed to create ticket channel: ${err.message}`);
    return interaction.editReply({ content: '❌ Failed to create ticket channel.' });
  }

  const ts = Math.floor(Date.now() / 1000);
  const welcomeText = (category.welcomeMessage ?? '👋 Welcome {user}!')
    .replace('{user}', `<@${user.id}>`);
  const statusOk    = order ? ['paid', 'completed'].includes((order.status || '').toLowerCase()) : true;
  const accentColor = order ? (statusOk ? config.successColor : config.warningColor) : config.botColor;

  const avatarUrl = user.displayAvatarURL({ size: 64, extension: 'png' });

  const kids = [];

  kids.push(section(
    [
      `## ${category.emoji} ${category.label}${order ? (statusOk ? ' Verified ✅' : ' ⚠️') : ''}`,
      welcomeText,
    ],
    avatarUrl
  ));

  kids.push(separator());

  kids.push(text([
    `👤 **Opened by:** <@${user.id}>`,
    `📁 **Category:** ${category.label}`,
    `⏰ **Opened:** <t:${ts}:F>`,
  ].join('\n')));

  if (order) {
    kids.push(separator(2));
    kids.push(text('### 📦 Order Details'));
    kids.push(separator());
    kids.push(text(buildOrderText(order)));
  }

  kids.push(separator(2));
  kids.push(text(`-# ${config.botName} • <t:${ts}:R>`));
  kids.push(ticketButtons(null));

  await ticketChannel.send(`<@${user.id}>`);

  await ticketChannel.send({
    components: [container(kids, accentColor)],
    flags: FLAGS_V2,
  });

  await editReplyV2(interaction,
    [text(`✅ Your ticket has been created: <#${ticketChannel.id}>`)],
    config.successColor
  );

  await logger.toDiscord(interaction.client, {
    title: '🎫 Ticket Opened',
    description: 'A new ticket has been opened.',
    color: config.successColor,
    fields: [
      { name: '👤 User',     value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: '📁 Category', value: category.label,                 inline: true },
      { name: '📌 Channel',  value: `${ticketChannel}`,             inline: true },
      ...(order ? [
        { name: '🆔 Order ID', value: `\`${order.id}\``,            inline: true },
        { name: '📦 Product',  value: order.product,                 inline: true },
        { name: '✅ Status',   value: capitalizeFirst(order.status), inline: true },
      ] : []),
    ],
  });

  logger.ticket(`Ticket opened: ${channelName} by ${user.tag}`);
}

async function promptClose(interaction) {
  await interaction.reply({
    components: [
      container([
        text('## 🔒 Close Ticket?'),
        separator(),
        text('Are you sure you want to close this ticket?\nA transcript will be saved automatically.'),
        separator(),
        closeConfirmButtons(),
      ], config.warningColor),
    ],
    flags: FLAGS_V2,
  });
}

async function closeTicket(interaction) {
  const channel = interaction.channel;

  await updateV2(interaction,
    [text('🔒 Closing ticket and saving transcript...')],
    config.warningColor
  );

  await generateTranscript(channel, interaction.client);

  const topic     = channel.topic ?? '';
  const userMatch = topic.match(/user:(\d+)/);
  const opener    = userMatch ? `<@${userMatch[1]}>` : 'Unknown';

  await logger.toDiscord(interaction.client, {
    title: '🔒 Ticket Closed',
    description: 'A ticket has been closed.',
    color: config.errorColor,
    fields: [
      { name: '📌 Channel', value: channel.name,               inline: true },
      { name: '👤 Opener',  value: opener,                      inline: true },
      { name: '🔒 Closed',  value: `<@${interaction.user.id}>`, inline: true },
    ],
  });

  logger.ticket(`Ticket closed: ${channel.name} by ${interaction.user.tag}`);

  const delay = (config.tickets.closeDelay ?? 5) * 1000;
  setTimeout(async () => {
    if (config.tickets.deleteOnClose || !config.channels.closedCategoryId) {
      await channel.delete().catch(() => {});
    } else {
      await channel.setParent(config.channels.closedCategoryId, { lockPermissions: false }).catch(() => {});
      await channel.permissionOverwrites.set([
        { id: channel.guild.id,            deny:  [PermissionFlagsBits.ViewChannel] },
        { id: channel.guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ]);
    }
  }, delay);
}

async function claimTicket(interaction) {
  const isStaff =
    interaction.member.roles.cache.some((r) => config.roles.staffRoleIds.includes(r.id)) ||
    interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!isStaff) {
    return interaction.reply({ content: '❌ Only staff can claim tickets.', ephemeral: true });
  }

  const channel      = interaction.channel;
  const topic        = channel.topic ?? '';
  const alreadyById  = getClaimedById(topic);

  if (alreadyById) {
    return interaction.reply({ content: `❌ Already claimed by <@${alreadyById}>.`, ephemeral: true });
  }

  await channel.setTopic(`${topic} | claimed:${interaction.user.id}`).catch(() => {});
  await updateWelcomeMessageButtons(channel, interaction.user.id);

  const avatarUrl = interaction.user.displayAvatarURL({ size: 64, extension: 'png' });
  await interaction.reply({
    components: [
      container([
        section([
          '### 🙋 Ticket Claimed',
          `**<@${interaction.user.id}>** is now handling this ticket.`,
          `-# Claimed <t:${Math.floor(Date.now() / 1000)}:R>`,
        ], avatarUrl),
      ], config.successColor),
    ],
    flags: FLAGS_V2,
  });

  await logger.toDiscord(interaction.client, {
    title: '🙋 Ticket Claimed',
    description: 'A ticket has been claimed.',
    color: config.botColor,
    fields: [
      { name: '📌 Channel',    value: `${channel}`,                inline: true },
      { name: '🙋 Claimed by', value: `<@${interaction.user.id}>`, inline: true },
    ],
  });
  logger.ticket(`Ticket claimed: ${channel.name} by ${interaction.user.tag}`);
}

async function unclaimTicket(interaction) {
  const isStaff =
    interaction.member.roles.cache.some((r) => [...config.roles.staffRoleIds, ...config.roles.adminRoleIds].includes(r.id)) ||
    interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

  if (!isStaff) {
    return interaction.reply({ content: '❌ Only staff can unclaim tickets.', ephemeral: true });
  }

  const channel     = interaction.channel;
  const topic       = channel.topic ?? '';
  const claimedById = getClaimedById(topic);

  if (!claimedById) {
    return interaction.reply({ content: '❌ This ticket is not claimed.', ephemeral: true });
  }

  const isAdmin =
    interaction.member.roles.cache.some((r) => (config.roles.adminRoleIds ?? []).includes(r.id)) ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  if (claimedById !== interaction.user.id && !isAdmin) {
    return interaction.reply({
      content: `❌ Only <@${claimedById}> or an admin can unclaim this.`,
      ephemeral: true,
    });
  }

  const newTopic = topic.replace(/\s*\|\s*claimed:\d+/, '').trim();
  await channel.setTopic(newTopic).catch(() => {});
  await updateWelcomeMessageButtons(channel, null);

  const avatarUrl = interaction.user.displayAvatarURL({ size: 64, extension: 'png' });
  await interaction.reply({
    components: [
      container([
        section([
          '### 🔓 Ticket Unclaimed',
          `**<@${interaction.user.id}>** released this ticket. Any staff member can now claim it.`,
          `-# Unclaimed <t:${Math.floor(Date.now() / 1000)}:R>`,
        ], avatarUrl),
      ], config.warningColor),
    ],
    flags: FLAGS_V2,
  });

  await logger.toDiscord(interaction.client, {
    title: '🔓 Ticket Unclaimed',
    description: 'A ticket has been unclaimed.',
    color: config.warningColor,
    fields: [
      { name: '📌 Channel',      value: `${channel}`,                inline: true },
      { name: '🔓 Unclaimed by', value: `<@${interaction.user.id}>`, inline: true },
    ],
  });
  logger.ticket(`Ticket unclaimed: ${channel.name} by ${interaction.user.tag}`);
}

async function updateWelcomeMessageButtons(channel, claimedById) {
  try {
    const messages = await channel.messages.fetch({ limit: 15 });
    const welcomeMsg = messages.find(
      (m) => m.author.bot && m.components[0]?.type === ComponentType.Container
    );
    if (!welcomeMsg) return;

    const panel = welcomeMsg.components[0].toJSON();
    const idx = panel.components.findLastIndex((c) => c.type === ComponentType.ActionRow);
    if (idx !== -1) panel.components[idx] = ticketButtons(claimedById);

    await welcomeMsg.edit({ components: [panel], flags: FLAGS_V2 });
  } catch (err) {
    logger.warn(`Could not update ticket buttons: ${err.message}`);
  }
}


async function manualTranscript(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const ok = await generateTranscript(interaction.channel, interaction.client);
  if (ok) {
    await editReplyV2(interaction,
      [text('📄 Transcript has been saved and posted in the transcript channel.')],
      config.successColor
    );
  } else {
    await interaction.editReply({ content: '❌ Failed to generate transcript.' });
  }
}

function readVerified() {
  if (!fs.existsSync(VERIFIED_FILE)) return {};
  return JSON.parse(fs.readFileSync(VERIFIED_FILE, 'utf-8'));
}

function trackVerifiedUser(userId, orderId) {
  try {
    const verified = readVerified();
    verified[userId] ??= [];
    if (!verified[userId].includes(orderId)) verified[userId].push(orderId);

    fs.mkdirSync(path.dirname(VERIFIED_FILE), { recursive: true });
    fs.writeFileSync(VERIFIED_FILE, JSON.stringify(verified, null, 2));
  } catch (err) {
    logger.warn(`Failed to track verified user: ${err.message}`);
  }
}

function isUserVerified(userId, orderId) {
  try {
    return readVerified()[userId]?.includes(orderId) ?? false;
  } catch {
    return false;
  }
}

async function notifyRefundStatus(client, orderId, newStatus, oldStatus) {
  if (!config.refundTracker?.enabled || newStatus !== 'refunded') return;

  try {
    const logChannel = await client.channels.fetch(config.channels.logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.warningColor)
      .setTitle('💰 Refund Processed')
      .setDescription(`Order status changed from **${oldStatus}** to **${newStatus}**`)
      .addFields({ name: 'Order ID', value: `\`${orderId}\``, inline: true })
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    logger.warn(`Failed to notify refund: ${err.message}`);
  }
}

const DAY = 24 * 60 * 60 * 1000;

async function checkAutoCloseTickets(guild) {
  if (!config.autoClose?.enabled) return;

  const inactivityMs = (config.autoClose.inactivityDays || 7) * DAY;
  const warningMs = (config.autoClose.warningDays || 3) * DAY;

  try {
    const channels = await guild.channels.fetch();
    for (const channel of channels.values()) {
      if (channel?.type !== ChannelType.GuildText) continue;
      if (!channel.topic?.includes('ticket:') || channel.topic.includes('[CLOSED]')) continue;

      const opened = channel.topic.match(/opened:<t:(\d+):/);
      if (!opened) continue;

      const lastMessage = await channel.messages.fetch({ limit: 1 }).then((m) => m.first()).catch(() => null);
      const idle = Date.now() - (lastMessage?.createdTimestamp ?? Number(opened[1]) * 1000);

      let notice = null;
      if (idle > inactivityMs) {
        notice = container([
          text(`🔒 **AUTO-CLOSE**: This ticket has been inactive for **${config.autoClose.inactivityDays} days** and will be closed in 24 hours unless claimed.`),
        ], config.errorColor);
      } else if (idle > inactivityMs - warningMs) {
        const daysLeft = Math.ceil((inactivityMs - idle) / DAY);
        notice = container([
          text(`⏰ **PENDING AUTO-CLOSE**: This ticket will be automatically closed in **${daysLeft} days** without activity.`),
        ], config.warningColor);
      }

      if (notice) await channel.send({ components: [notice], flags: FLAGS_V2 }).catch(() => {});
    }
  } catch (err) {
    logger.error(`Auto-close check failed: ${err.message}`);
  }
}

module.exports = {
  sendPanel,
  handleCategorySelect,
  handleOrderModal,
  promptClose,
  closeTicket,
  claimTicket,
  unclaimTicket,
  manualTranscript,
  trackVerifiedUser,
  isUserVerified,
  notifyRefundStatus,
  checkAutoCloseTickets,
};
