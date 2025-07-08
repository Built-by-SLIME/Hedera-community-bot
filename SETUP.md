# 🔧 Quick Setup Guide

## Prerequisites
- Node.js 16.9.0+
- Discord Developer Account
- Hedera account (optional, for giveaways)

## Discord Bot Setup

1. **Create Application**: [Discord Developer Portal](https://discord.com/developers/applications) → New Application
2. **Create Bot**: Bot section → Add Bot → Copy Token
3. **Get Client ID**: General Information → Copy Application ID
4. **Set Permissions**: Bot section → Send Messages, Use Slash Commands, Manage Roles
5. **Invite Bot**: OAuth2 → URL Generator → `bot` + `applications.commands` scopes → Copy URL → Authorize

## Local Setup

```bash
git clone https://github.com/Built-by-SLIME/Hedera-community-bot.git
cd Hedera-community-bot
npm install
cp .env.example .env
```

## Environment Variables

Edit `.env` with your values:

### Required (Bot won't start without these)

```env
# Discord Bot Token (from Bot section)
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE

# Discord Application ID (from General Information)
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID_HERE

# Your Hedera NFT Token ID to verify
TOKEN_ID=YOUR_HEDERA_TOKEN_ID_HERE
```

### Optional (Features disabled if not provided)

```env
# Daily Hedera ecosystem highlights (right-click channel > Copy ID)
DAILY_MESSAGE_CHANNEL_ID=YOUR_DAILY_CHANNEL_ID_HERE

# New member welcome messages (right-click channel > Copy ID)
WELCOME_CHANNEL_ID=YOUR_WELCOME_CHANNEL_ID_HERE

# NFT Giveaway System (both required for giveaways)
FAUCET_ACCOUNT_ID=YOUR_HEDERA_ACCOUNT_ID_HERE
FAUCET_PRIVATE_KEY=YOUR_HEDERA_PRIVATE_KEY_HERE

# Database (SQLite for local, PostgreSQL for production)
DATABASE_PATH=./data.db
DATABASE_URL=postgresql://user:pass@host:5432/db

# Hedera API (has default, change only for testnet)
HEDERA_MIRROR_NODE_URL=https://mainnet-public.mirrornode.hedera.com
```

## Run Bot

```bash
npm run deploy-commands
npm start
```

Look for `✅ Bot successfully logged in` in console.

## Server Setup

In Discord, run these admin-only commands:

```
/setup          # Initialize bot for your server
/set-rules      # Configure role assignment rules
```

## Features Overview

**All users:**
- `/verify-wallet` - Verify Hedera NFT ownership, get roles
- `/status` - Check verification status
- `/help` - Command help
- `/enter-giveaway` - Enter active giveaways (requires verification)

**Admins only:**
- `/start-giveaway` - Launch NFT giveaways with automatic distribution
- `/bot-status` - Bot health and statistics

**Automatic features:**
- **Role updates** - Every 30 minutes based on current NFT holdings
- **Sales tracking** - Real-time NFT sales notifications via Hedera Mirror Node
- **Daily messages** - 8AM EST Hedera ecosystem highlights (if channel configured)
- **Welcome messages** - New member greetings (if channel configured)

## Troubleshooting

**Bot won't start:** Check `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`
**No commands:** Run `npm run deploy-commands`, wait 5-10 minutes
**Verification fails:** Verify `TOKEN_ID` is correct Hedera token
**Giveaways fail:** Check both `FAUCET_ACCOUNT_ID` and `FAUCET_PRIVATE_KEY` are set

**Production deployment:** See [DEPLOYMENT.md](DEPLOYMENT.md)
