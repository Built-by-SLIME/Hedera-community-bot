# 🤖 Hedera Community Discord Bot

A powerful, open-source Discord bot for the Hedera ecosystem that verifies NFT ownership, manages community roles, and provides automated features for Hedera-based Discord servers.

## ✨ Features

- **🔐 NFT Verification**: Verify Hedera NFT ownership and assign roles automatically
- **🎁 Giveaway System**: Admin-controlled NFT giveaways with automatic distribution
- **📊 Sales Tracking**: Real-time NFT sales notifications via Hedera Mirror Node
- **🌅 Daily Messages**: Automated daily Hedera ecosystem highlights
- **⚡ Auto Role Updates**: Periodic role synchronization based on current NFT holdings
- **🛡️ Admin Controls**: Comprehensive server setup and rule management

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/Built-by-SLIME/Hedera-community-bot.git
   cd Hedera-community-bot
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values (see SETUP.md for details)
   ```

3. **Deploy & Start**
   ```bash
   npm run deploy-commands
   npm start
   ```

📖 **Need detailed setup instructions?** See [SETUP.md](SETUP.md)
🚀 **Want to deploy to Railway?** See [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎮 Commands

### Public Commands
- `/verify-wallet <accountId>` - Verify your Hedera wallet and get roles
- `/status` - Check your current verification status
- `/help` - Get help with bot commands
- `/enter-giveaway` - Enter active giveaways (requires verification)
- `/giveaway-status` - Check current giveaway status

### Admin Commands
- `/setup` - Initialize bot for your server
- `/set-rules` - Configure role assignment rules
- `/start-giveaway` - Launch NFT giveaways
- `/bot-status` - Check bot health and statistics

## 🔧 Requirements

- **Node.js** 16.9.0 or higher
- **Discord Bot** with appropriate permissions
- **Hedera Account** (for giveaway features)
- **PostgreSQL** (production) or **SQLite** (development)

## 📋 Environment Variables

The bot requires several environment variables for configuration:

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | ✅ | Your Discord bot token |
| `DISCORD_CLIENT_ID` | ✅ | Your Discord application client ID |
| `TOKEN_ID` | ✅ | Hedera NFT token ID to verify |
| `DAILY_MESSAGE_CHANNEL_ID` | 🔶 | Channel for daily ecosystem messages |
| `WELCOME_CHANNEL_ID` | 🔶 | Channel for new member welcomes |
| `FAUCET_ACCOUNT_ID` | 🔶 | Hedera account for giveaways |
| `FAUCET_PRIVATE_KEY` | 🔶 | Private key for giveaway transfers |
| `DATABASE_URL` | 🔶 | PostgreSQL connection (production) |
| `HEDERA_MIRROR_NODE_URL` | 🔶 | Hedera API endpoint (has default) |

**✅ Required** = Bot won't start without these
**🔶 Optional** = Features disabled if not provided

## 🏗️ Architecture

- **Discord.js v14** - Discord API integration
- **Hedera SDK** - Blockchain interactions and NFT transfers
- **PostgreSQL/SQLite** - Dual database support
- **Node-cron** - Automated scheduling
- **Railway.app** - Recommended hosting platform

## 🤝 Contributing

This is an open-source project! Contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check [SETUP.md](SETUP.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **X/Twitter**: https://x.com/builtbyslime
- **GitHub Issues**: https://github.com/Built-by-SLIME/Hedera-community-bot/issues

## 🙏 Acknowledgments

Built for the Hedera community with ❤️ by @builtbyslime

- **Mauii_MW** - Sharing a portion of their bot code
- **Be3bzilla** - Helping test and provide feedback

---

**⭐ If this bot helps your community, please give it a star!**
