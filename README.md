# MCSell Support Bot

This bot runs the support tickets for the MCSell Discord server. Members open a ticket from a panel, choose what they need help with, and talk to the team in a private channel. Staff can claim tickets, keep them organized, and save a transcript when one is closed.

Customer Support tickets ask for an order or invoice ID and check it through Sellauth before opening the ticket. The bot can also show order details to staff, post verification and payment panels, and close tickets after a configurable period of inactivity.

## What you can do

- Set up ticket categories for general, customer, payment, media, technical, or partnership questions. Each category can have its own staff roles and access rules.
- Let staff claim or unclaim a ticket, add or remove a member, rename the channel, or close it.
- Ask a member before closing with `/closerequest`. The bot sends them a DM and records the request in the log channel.
- Use `/checkorder` to look up an invoice in Sellauth. Customer Support tickets use the same lookup to verify an order.
- Mark payment tickets as complete with `/donepay`.
- Save a ticket as an HTML transcript. Transcripts are kept in `transcripts/` and sent to the transcript channel set in the config.
- Use `/stats` to see ticket and staff activity.
- Post server verification, payment method, and PayPal information with the setup commands.

## Commands

These commands are registered to the server in `GUILD_ID` when the bot starts.

| Command | What it does |
| --- | --- |
| `/panel` | Post the ticket category panel. |
| `/verifysetup` | Post the server verification panel. |
| `/paymentsetup` | Post the configured payment methods. |
| `/paypal` | Show the configured PayPal details. |
| `/checkorder orderid` | Look up an order in Sellauth. Staff only. |
| `/claim` and `/unclaim` | Claim the current ticket or make it available to another staff member. |
| `/add user` and `/remove user` | Give or remove a member's access to the current ticket. |
| `/rename name` | Rename the current ticket channel. |
| `/closerequest` | Ask the ticket owner before closing. Staff only. |
| `/close` | Close the current ticket and save a transcript. |
| `/transcript` | Save and post a transcript without closing the ticket. Staff only. |
| `/donepay` | Move a payment ticket to the completed category. |
| `/givecustomer user` | Give a member the customer role. |
| `/stats` | Show ticket and staff activity. Staff only. |

## Setup

You'll need Node.js 18 or newer and a Discord application with a bot. Sellauth credentials are only needed for order lookups and customer order verification.

1. Install the packages with `npm install`.
2. Copy `.env.example` to `.env`. Set `BOT_TOKEN`, `CLIENT_ID`, and `GUILD_ID`.
3. If you're using order checks, also set `SELLAUTH_API_KEY` and `SELLAUTH_SHOP_ID`.
4. In `config.js`, replace the `Channel_Id` and `Role_Id` placeholders with your server's IDs. Set the ticket categories, staff roles, and channel IDs there as well.
5. In the Discord Developer Portal, enable the **Server Members Intent** and **Message Content Intent**. Invite the bot with the `bot` and `applications.commands` scopes.
6. Give it permission to manage channels, view and send messages, read message history, embed links, and attach files. It also needs **Manage Roles** if you use verification or autoroles.
7. Run `npm start`.

The bot creates `data/verified_users.json` when it needs to store a verified user and order ID. That file contains Discord user IDs and order IDs. Transcripts are saved in `transcripts/` and can contain private support conversations. Check them and make sure they're okay to share before publishing them. Keep `.env` private.

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for the full license text.
