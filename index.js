require('dotenv').config();

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./src/utils/logger');

const required = ['BOT_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
for (const key of required) {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`);
    logger.error('Please copy .env.example to .env and fill in your values.');
    process.exit(1);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));
const commandData = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (!command.data || !command.execute) {
    logger.warn(`Command file ${file} is missing data or execute skipping.`);
    continue;
  }
  client.commands.set(command.data.name, command);
  commandData.push(command.data.toJSON());
  logger.info(`Loaded command: /${command.data.name}`);
}

const eventsPath = path.join(__dirname, 'src', 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  logger.info(`Loaded event: ${event.name}`);
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  logger.info('Registering slash commands...');

  try {
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commandData,
    });
    logger.success(`Successfully registered ${commandData.length} slash command(s).`);
  } catch (err) {
    logger.error(`Failed to register slash commands: ${err.message}`);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
});

(async () => {
  await registerCommands();
  await client.login(process.env.BOT_TOKEN);
})();
