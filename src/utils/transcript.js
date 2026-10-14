const { encode } = require('html-entities');
const { AttachmentBuilder } = require('discord.js');
const config = require('../../config');
const logger = require('./logger');
const path = require('path');
const fs = require('fs-extra');

async function generateTranscript(channel, client) {
  try {
    const messages = await fetchAllMessages(channel, config.tickets.transcriptMessageLimit);
    if (!messages.length) return null;

    const html = buildHtml(channel, messages);

    const dir = path.join(process.cwd(), 'transcripts');
    await fs.ensureDir(dir);
    const filePath = path.join(dir, `${channel.name}-${Date.now()}.html`);
    await fs.writeFile(filePath, html, 'utf-8');

    const transcriptCh = await client.channels
      .fetch(config.channels.transcriptChannelId)
      .catch(() => null);

    if (transcriptCh) {
      const attachment = new AttachmentBuilder(filePath, {
        name: `${channel.name}-transcript.html`,
      });

      const firstMsg = messages[messages.length - 1];
      const lastMsg = messages[0];

      await transcriptCh.send({
        content:
          `📄 **Transcript** \`${channel.name}\`\n` +
          `> Messages: **${messages.length}** | Created by: ${firstMsg.author.tag}`,
        files: [attachment],
      });
    }

    return filePath;
  } catch (err) {
    logger.error(`Failed to generate transcript: ${err.message}`);
    return null;
  }
}

async function fetchAllMessages(channel, limit = 200) {
  const messages = [];
  let last = null;

  while (messages.length < limit) {
    const batch = await channel.messages.fetch({
      limit: Math.min(100, limit - messages.length),
      ...(last ? { before: last } : {}),
    });

    if (!batch.size) break;
    messages.push(...batch.values());
    last = batch.last().id;

    if (batch.size < 100) break;
  }

  return messages.reverse();
}

function buildHtml(channel, messages) {
  const messageRows = messages
    .map((m) => {
      const avatar = m.author.displayAvatarURL({ extension: 'png', size: 64 });
      const time = `<t:${Math.floor(m.createdTimestamp / 1000)}:F>`;
      const content = m.content
        ? `<div class="content">${linkify(encode(m.content)).replace(/\n/g, '<br>')}</div>`
        : '';

      const attachments = [...m.attachments.values()]
        .map((a) => {
          if (a.contentType?.startsWith('image/')) {
            return `<img class="attachment-img" src="${a.url}" alt="attachment" />`;
          }
          return `<a class="attachment-link" href="${a.url}" target="_blank">📎 ${encode(a.name)}</a>`;
        })
        .join('');

      const embeds = m.embeds
        .map((e) => {
          const color = e.color ? `#${e.color.toString(16).padStart(6, '0')}` : '#5865F2';
          return `
            <div class="embed" style="border-left-color:${color}">
              ${e.title ? `<div class="embed-title">${encode(e.title)}</div>` : ''}
              ${e.description ? `<div class="embed-desc">${encode(e.description).replace(/\n/g, '<br>')}</div>` : ''}
              ${e.fields.map((f) => `<div class="embed-field"><span class="field-name">${encode(f.name)}</span><span class="field-value">${encode(f.value)}</span></div>`).join('')}
            </div>`;
        })
        .join('');

      return `
        <div class="message ${m.author.bot ? 'bot' : ''}">
          <img class="avatar" src="${avatar}" alt="avatar" />
          <div class="msg-body">
            <div class="meta">
              <span class="username" style="color:${m.member?.displayHexColor ?? '#ffffff'}">${encode(m.author.tag)}</span>
              <span class="timestamp">${new Date(m.createdTimestamp).toLocaleString('en-US')}</span>
              ${m.author.bot ? '<span class="bot-badge">BOT</span>' : ''}
            </div>
            ${content}
            ${attachments}
            ${embeds}
          </div>
        </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Transcript ${encode(channel.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #313338; color: #dbdee1; font-family: 'Discord Noto Sans', 'Noto Sans', 'Helvetica Neue', sans-serif; font-size: 14px; }
    header { background: #1e1f22; padding: 20px 32px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #3f4147; }
    header .channel-name { font-size: 20px; font-weight: 700; color: #f2f3f5; }
    header .meta { font-size: 12px; color: #949ba4; margin-top: 4px; }
    header .badge { background: #5865f2; color: #fff; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .messages { padding: 24px 32px; max-width: 900px; margin: 0 auto; }
    .message { display: flex; gap: 16px; padding: 8px 0; border-radius: 4px; transition: background .1s; }
    .message:hover { background: #2e3035; }
    .message.bot .username::after { content: ''; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; margin-top: 2px; }
    .msg-body { flex: 1; min-width: 0; }
    .meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
    .username { font-weight: 600; font-size: 15px; }
    .timestamp { font-size: 11px; color: #949ba4; }
    .bot-badge { background: #5865f2; color: #fff; padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .content { color: #dbdee1; line-height: 1.5; word-break: break-word; }
    .content a { color: #00aff4; text-decoration: none; }
    .attachment-img { max-width: 400px; max-height: 300px; border-radius: 4px; margin-top: 8px; display: block; }
    .attachment-link { display: inline-block; margin-top: 6px; color: #00aff4; text-decoration: none; }
    .embed { border-left: 4px solid #5865f2; background: #2b2d31; border-radius: 4px; padding: 10px 14px; margin-top: 8px; max-width: 520px; }
    .embed-title { font-weight: 700; color: #ffffff; margin-bottom: 6px; }
    .embed-desc { color: #dbdee1; font-size: 13px; line-height: 1.4; }
    .embed-field { margin-top: 8px; }
    .field-name { display: block; font-weight: 600; font-size: 12px; color: #b5bac1; }
    .field-value { display: block; font-size: 13px; color: #dbdee1; }
    footer { text-align: center; padding: 24px; color: #4e5058; font-size: 12px; border-top: 1px solid #3f4147; margin-top: 24px; }
  </style>
</head>
<body>
  <header>
    <div>
      <div class="channel-name"># ${encode(channel.name)}</div>
      <div class="meta">
        ${encode(channel.guild?.name ?? 'Unknown Server')} &nbsp;•&nbsp;
        ${messages.length} messages &nbsp;•&nbsp;
        Generated on ${new Date().toLocaleString('en-US')}
      </div>
    </div>
    <span class="badge">${config.botName}</span>
  </header>
  <div class="messages">
    ${messageRows}
  </div>
  <footer>Generated by ${encode(config.botName)} Ticket Bot</footer>
</body>
</html>`;
}

function linkify(text) {
  return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
}

module.exports = { generateTranscript };
