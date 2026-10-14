const { Events } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../../config');
const { FLAGS_V2, text, container } = require('../utils/components');
const {
  handleCategorySelect,
  handleOrderModal,
  promptClose,
  closeTicket,
  claimTicket,
  unclaimTicket,
  manualTranscript,
} = require('../handlers/ticketHandler');

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_category_select') {
          await handleCategorySelect(interaction);
        }
        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('ticket_order_modal:')) {
          const categoryId = interaction.customId.split(':')[1];
          await handleOrderModal(interaction, categoryId);
        }
        return;
      }

      if (interaction.isButton()) {
        switch (interaction.customId) {
          case 'ticket_close':
            await promptClose(interaction);
            break;

          case 'ticket_close_confirm':
            await closeTicket(interaction);
            break;

          case 'ticket_close_cancel':
            await interaction.update({
              components: [container([text('✅ Ticket close cancelled.')], config.successColor)],
              flags: FLAGS_V2,
            });
            break;

          case 'ticket_claim':
            await claimTicket(interaction);
            break;

          case 'ticket_unclaim':
            await unclaimTicket(interaction);
            break;

          case 'ticket_transcript':
            await manualTranscript(interaction);
            break;

          case 'verify_button': {
            const roleId = config.verify?.roleId;
            if (!roleId) {
              return interaction.reply({ content: '❌ Verify role is not configured.', flags: 64 });
            }
            const member = interaction.member;
            if (member.roles.cache.has(roleId)) {
              return interaction.reply({ content: '✅ You are already verified!', flags: 64 });
            }
            try {
              await member.roles.add(roleId);
              await interaction.reply({ content: '✅ You have been verified!', flags: 64 });
              logger.info(`[VERIFY] ${interaction.user.tag} (${interaction.user.id}) verified`);
            } catch (e) {
              logger.error(`[VERIFY] Failed to add role: ${e.message}`);
              await interaction.reply({ content: '❌ Failed to verify. Please contact staff.', flags: 64 });
            }
            break;
          }

          default:
            break;
        }
      }
    } catch (err) {
      logger.error(`Interaction error: ${err.message}`);
      logger.error(err.stack);

      const opts = { content: `⚠️ Something went wrong.\n\`\`\`${err.message}\`\`\``, flags: 64 };
      const send = interaction.replied || interaction.deferred
        ? interaction.followUp(opts)
        : interaction.reply(opts);
      await send.catch(() => {});
    }
  },
};
