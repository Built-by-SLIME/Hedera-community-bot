# 🚀 Railway Deployment Guide

**Note:** These instructions are specifically for Railway.app using their $5/month plan. While you can deploy this bot for free using Oracle Cloud or similar platforms, the configuration is more complex and we don't provide support for those deployments.

## Prerequisites
- GitHub account with your bot code
- Railway account (https://railway.app)
- Environment variables from [SETUP.md](SETUP.md)

## Railway Setup

1. **Create Project**: [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → Select your `Hedera-community-bot` fork
2. **Add Database**: Project dashboard → + New → Database → PostgreSQL (wait ~30 seconds)
3. **Note**: Railway automatically provides `DATABASE_URL` - don't set this manually

## Environment Variables

Click your **bot service** (not database) → **Variables** tab → Add these variables:

### Required
```
DISCORD_TOKEN = your_bot_token_here
DISCORD_CLIENT_ID = your_application_id_here
TOKEN_ID = your_hedera_token_id
```

### Optional Features
```
# Daily ecosystem highlights
DAILY_MESSAGE_CHANNEL_ID = your_daily_channel_id

# New member welcomes
WELCOME_CHANNEL_ID = your_welcome_channel_id

# NFT giveaway system (both required)
FAUCET_ACCOUNT_ID = your_hedera_account_id
FAUCET_PRIVATE_KEY = your_hedera_private_key

# API endpoint (has default)
HEDERA_MIRROR_NODE_URL = https://mainnet-public.mirrornode.hedera.com
```

**Database:** Railway automatically sets `DATABASE_URL` for PostgreSQL. Your bot uses SQLite locally and PostgreSQL in production automatically.

## Deployment

Railway auto-deploys when you push to GitHub or change variables. Monitor in **Deployments** tab.

**Success logs:**
```
✅ Bot successfully logged in as YourBot#1234
🐘 Using PostgreSQL database
🚀 Bot is ready and running!
```

**Common errors:**
```
❌ DISCORD_TOKEN environment variable is not set!
❌ Failed to login to Discord: Invalid token
```

Test with `/help` in Discord once deployed.

## Railway Pricing

**$5/month plan includes:**
- 500 hours runtime (24/7 coverage)
- 1GB memory per service
- 1GB PostgreSQL storage
- Automatic backups and maintenance

This covers one Discord bot serving multiple servers with all features enabled.

## Updates

**Code updates:** Push to GitHub → Railway auto-deploys
**Variable updates:** Railway Variables tab → Bot auto-restarts
**Database:** Automatic backups and maintenance

## Troubleshooting

**Bot won't start:** Check required variables are set correctly
**Database issues:** Ensure PostgreSQL service is running in same project
**Commands missing:** Wait 5-10 minutes for Discord cache, check bot permissions

---

**🎉 Your bot is now live 24/7!** Monitor the Railway dashboard and gather community feedback.
