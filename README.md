# SLIME Discord Verification Bot

A Discord bot that verifies NFT ownership on the Hedera network and assigns roles based on token quantity and serial numbers.

## Setup

1. Install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Deploy commands: `npm run deploy`
4. Start the bot: `npm start`

## Commands

- `/verify-wallet <accountId>` - Verify your Hedera wallet to get roles
- `/setup` - Initialize bot for this server (admin only)
- `/set-rules` - Set role assignment rules (admin only)
