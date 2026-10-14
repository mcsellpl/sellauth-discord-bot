const { ComponentType, MessageFlags } = require('discord.js');

const FLAGS_V2 = MessageFlags.IsComponentsV2;

const text = (content) => ({ type: ComponentType.TextDisplay, content });

const separator = (spacing = 1) => ({ type: ComponentType.Separator, divider: true, spacing });

function section(lines, thumbnailUrl) {
  const s = {
    type: ComponentType.Section,
    components: lines.filter(Boolean).map(text),
  };
  if (typeof thumbnailUrl === 'string' && thumbnailUrl.startsWith('http')) {
    s.accessory = { type: ComponentType.Thumbnail, media: { url: thumbnailUrl } };
  }
  return s;
}

function container(children, color) {
  const c = { type: ComponentType.Container, components: children };
  if (color != null) c.accent_color = color;
  return c;
}

function button(customId, label, style, emoji) {
  const b = { type: ComponentType.Button, custom_id: customId, label, style };
  if (emoji) b.emoji = { name: emoji };
  return b;
}

const row = (...components) => ({ type: ComponentType.ActionRow, components });

module.exports = { FLAGS_V2, text, separator, section, container, button, row };
