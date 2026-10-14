# MCSell Support Bot

This bot handles support tickets for the MCSell Discord server. Staff can manage tickets in Discord, and customer tickets can be checked against Sellauth orders.

It also saves ticket transcripts, posts verification and payment panels, and can close tickets that have been inactive for too long. The settings for these features are in `config.js`.

## Run it

You'll need Node.js 18 or newer, a Discord bot, and Sellauth API credentials if you want to use order checks.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and add your Discord bot token, application ID, and server ID.
3. Add your Sellauth API key and shop ID if you're using order verification or `/checkorder`.
4. Open `config.js` and replace the `Channel_Id` and `Role_Id` placeholders with IDs from your server. Set up the ticket categories and other options there too.
5. In the Discord Developer Portal, turn on the **Server Members Intent** and **Message Content Intent**.
6. Give the bot permission to view and send messages, read message history, manage channels and messages, embed links, and attach files. It also needs **Manage Roles** if you use verification or autoroles.
7. Start it with `npm start`.

The bot registers its slash commands for the server in `GUILD_ID` each time it starts.

Keep your `.env` file private. The bot saves verified user and order IDs in `data/verified_users.json`; that file is created automatically and should stay out of public uploads.