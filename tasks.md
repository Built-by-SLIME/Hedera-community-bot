# Step-by-Step Plan to Build the Discord NFT Verification Bot MVP

This document provides a granular, step-by-step plan to build the Minimum Viable Product (MVP) for the Discord NFT verification bot based on the previously outlined architecture. Each task is small, testable, and focused on a single concern to enable incremental development and testing. The plan is designed for an engineering LLM to complete one task at a time, allowing for testing between steps. The bot will use Node.js, Discord.js, SQLite with `better-sqlite3`, the Hedera Mirror Node REST API, and be hosted on Railway.app.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Plan](#development-plan)
  - [Setup and Initialization](#setup-and-initialization)
  - [Database Setup](#database-setup)
  - [Discord Bot Core](#discord-bot-core)
  - [Hedera Integration](#hedera-integration)
  - [Role Assignment Logic](#role-assignment-logic)
  - [Slash Commands](#slash-commands)
  - [Deployment](#deployment)
- [Testing Guidelines](#testing-guidelines)

## Prerequisites
- Node.js (v16 or higher) installed locally.
- A Discord bot token from the Discord Developer Portal.
- Access to the Hedera Mirror Node REST API (publicly available at `https://mainnet-public.mirrornode.hedera.com`).
- A Railway.app account for deployment.
- Basic knowledge of JavaScript and command-line tools.

## Development Plan

Each task is designed to be small, self-contained, and testable, with a clear start and end. Tasks are grouped by component for clarity but can be executed sequentially.

### Setup and Initialization

1. **Create Project Directory and Initialize Node.js Project**
   - **Description**: Set up the project folder and initialize a Node.js project with `npm`.
   - **Steps**:
     - Create a directory named `discord-nft-bot`.
     - Run `npm init -y` to create a `package.json`.
     - Verify `package.json` exists with default values.
   - **Test**: Confirm `discord-nft-bot/package.json` exists and contains valid JSON.
   - **Output**: `package.json` file.

2. **Install Core Dependencies**
   - **Description**: Install `discord.js`, `better-sqlite3`, and `axios`.
   - **Steps**:
     - Run `npm install discord.js@14.14.1 better-sqlite3@9.4.3 axios@1.7.2`.
     - Verify `node_modules` and `package-lock.json` are created.
   - **Test**: Run `npm list` to confirm dependencies are installed.
   - **Output**: Updated `package.json` and `node_modules`.

3. **Create File Structure**
   - **Description**: Set up the folder structure as per the architecture.
   - **Steps**:
     - Create folders: `src/`, `src/commands/`, `src/commands/public/`, `src/commands/admin/`, `src/services/`, `src/database/`, `src/database/models/`, `src/utils/`.
     - Create empty files: `src/bot.js`, `src/deploy-commands.js`, `src/commands/public/verify.js`, `src/commands/admin/setup.js`, `src/commands/admin/set-rules.js`, `src/services/hederaService.js`, `src/services/discordService.js`, `src/services/roleAssignment.js`, `src/database/db.js`, `src/database/models/rules.js`, `src/utils/logger.js`, `src/utils/constants.js`, `.env`, `README.md`, `.gitignore`, `railway.yml`.
   - **Test**: Confirm all folders and files exist using `ls` or `dir`.
   - **Output**: Complete folder structure.

4. **Set Up `.gitignore`**
   - **Description**: Create a `.gitignore` file to exclude unnecessary files.
   - **Steps**:
     - Add the following to `.gitignore`:
       ```
       node_modules/
       .env
       data.db
       ```
     - Save the file.
   - **Test**: Confirm `.gitignore` contains `node_modules`, `.env`, and `data.db`.
   - **Output**: `.gitignore` file.

5. **Set Up Environment Variables**
   - **Description**: Create a `.env` file with placeholder values.
   - **Steps**:
     - Create `.env` with:
       ```plaintext
       DISCORD_TOKEN=your_discord_bot_token
       HEDERA_MIRROR_NODE_URL=https://mainnet-public.mirrornode.hedera.com
       DATABASE_PATH=./data.db
       ```
     - Replace `your_discord_bot_token` with a placeholder for now.
   - **Test**: Confirm `.env` exists and contains the three variables.
   - **Output**: `.env` file.

### Database Setup

6. **Initialize SQLite Database**
   - **Description**: Set up SQLite database connection in `db.js`.
   - **Steps**:
     - In `src/database/db.js`, add:
       ```javascript
       const Database = require('better-sqlite3');
       const path = require('path');

       const db = new Database(process.env.DATABASE_PATH || './data.db', { verbose: console.log });
       module.exports = db;
       ```
     - Ensure `DATABASE_PATH` is read from `.env`.
   - **Test**: Run `node src/database/db.js` to ensure no errors and `data.db` is created.
   - **Output**: `src/database/db.js`, `data.db` file.

7. **Create Rules Table**
   - **Description**: Define the `rules` table schema in `rules.js`.
   - **Steps**:
     - In `src/database/models/rules.js`, add:
       ```javascript
       const db = require('../db');

       function initializeRulesTable() {
         db.prepare(`
           CREATE TABLE IF NOT EXISTS rules (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             type TEXT NOT NULL,
             value TEXT NOT NULL,
             role_id TEXT NOT NULL,
             guild_id TEXT NOT NULL
           )
         `).run();
       }

       initializeRulesTable();
       module.exports = { initializeRulesTable };
       ```
   - **Test**: Run `node src/database/models/rules.js` and check `data.db` for the `rules` table using a SQLite client (e.g., `sqlite3 data.db "SELECT name FROM sqlite_master WHERE type='table'"`).
   - **Output**: `src/database/models/rules.js`, `rules` table in `data.db`.

8. **Add Rule CRUD Operations**
   - **Description**: Implement functions to manage rules in `rules.js`.
   - **Steps**:
     - In `src/database/models/rules.js`, add:
       ```javascript
       const db = require('../db');

       function initializeRulesTable() {
         db.prepare(`
           CREATE TABLE IF NOT EXISTS rules (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             type TEXT NOT NULL,
             value TEXT NOT NULL,
             role_id TEXT NOT NULL,
             guild_id TEXT NOT NULL
           )
         `).run();
       }

       function addRule(type, value, roleId, guildId) {
         const stmt = db.prepare('INSERT INTO rules (type, value, role_id, guild_id) VALUES (?, ?, ?, ?)');
         return stmt.run(type, value, roleId, guildId);
       }

       function getRulesByGuild(guildId) {
         const stmt = db.prepare('SELECT * FROM rules WHERE guild_id = ?');
         return stmt.all(guildId);
       }

       initializeRulesTable();
       module.exports = { initializeRulesTable, addRule, getRulesByGuild };
       ```
   - **Test**: Run a test script to add a rule (e.g., `addRule('quantity', '5', '12345', '67890')`) and retrieve it with `getRulesByGuild('67890')`.
   - **Output**: Updated `src/database/models/rules.js`.

### Discord Bot Core

9. **Initialize Discord Bot**
   - **Description**: Set up the Discord.js client in `bot.js`.
   - **Steps**:
     - In `src/bot.js`, add:
       ```javascript
       const { Client, GatewayIntentBits } = require('discord.js');
       require('dotenv').config();

       const client = new Client({
         intents: [
           GatewayIntentBits.Guilds,
           GatewayIntentBits.GuildMembers
         ]
       });

       client.once('ready', () => {
         console.log(`Logged in as ${client.user.tag}`);
       });

       client.login(process.env.DISCORD_TOKEN);
       ```
   - **Test**: Replace `DISCORD_TOKEN` in `.env` with a valid token, run `node src/bot.js`, and confirm the bot logs in and prints the tag.
   - **Output**: `src/bot.js`.

10. **Add Interaction Handler**
    - **Description**: Add a basic `interactionCreate` event handler in `bot.js`.
    - **Steps**:
      - Update `src/bot.js`:
        ```javascript
        const { Client, GatewayIntentBits } = require('discord.js');
        require('dotenv').config();

        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers
          ]
        });

        client.once('ready', () => {
          console.log(`Logged in as ${client.user.tag}`);
        });

        client.on('interactionCreate', async (interaction) => {
          if (!interaction.isCommand()) return;
          console.log(`Received command: ${interaction.commandName}`);
          await interaction.reply('Command received!');
        });

        client.login(process.env.DISCORD_TOKEN);
        ```
    - **Test**: Run the bot, execute a test slash command (e.g., via a temporary command), and confirm the reply.
    - **Output**: Updated `src/bot.js`.

### Hedera Integration

11. **Set Up Constants**
    - **Description**: Define constants like token ID in `constants.js`.
    - **Steps**:
      - In `src/utils/constants.js`, add:
        ```javascript
        module.exports = {
          TOKEN_ID: '0.0.8357917',
          HEDERA_MIRROR_NODE_URL: process.env.HEDERA_MIRROR_NODE_URL
        };
        ```
    - **Test**: Import and log `TOKEN_ID` in a test script to confirm the value.
    - **Output**: `src/utils/constants.js`.

12. **Implement Hedera NFT Query**
    - **Description**: Create a function to query NFT data in `hederaService.js`.
    - **Steps**:
      - In `src/services/hederaService.js`, add:
        ```javascript
        const axios = require('axios');
        const { TOKEN_ID, HEDERA_MIRROR_NODE_URL } = require('../utils/constants');

        async function getNFTData(accountId) {
          try {
            const response = await axios.get(
              `${HEDERA_MIRROR_NODE_URL}/api/v1/accounts/${accountId}/nfts?token.id=${TOKEN_ID}`
            );
            const nfts = response.data.nfts || [];
            return {
              ownsToken: nfts.length > 0,
              quantity: nfts.length,
              serials: nfts.map(nft => nft.serial_number)
            };
          } catch (error) {
            console.error('Hedera API error:', error.message);
            return { ownsToken: false, quantity: 0, serials: [] };
          }
        }

        module.exports = { getNFTData };
        ```
    - **Test**: Call `getNFTData('0.0.1231234')` in a test script and confirm the response format.
    - **Output**: `src/services/hederaService.js`.

### Role Assignment Logic

13. **Implement Discord Service**
    - **Description**: Create functions to manage roles in `discordService.js`.
    - **Steps**:
      - In `src/services/discordService.js`, add:
        ```javascript
        async function assignRole(member, roleId) {
          try {
            await member.roles.add(roleId);
            return true;
          } catch (error) {
            console.error('Role assignment error:', error.message);
            return false;
          }
        }

        async function removeRole(member, roleId) {
          try {
            await member.roles.remove(roleId);
            return true;
          } catch (error) {
            console.error('Role removal error:', error.message);
            return false;
          }
        }

        module.exports = { assignRole, removeRole };
        ```
    - **Test**: Mock a member object and test `assignRole`/`removeRole` in a controlled environment (requires bot running in later steps).
    - **Output**: `src/services/discordService.js`.

14. **Implement Role Assignment Logic**
    - **Description**: Create logic to map NFT data to roles in `roleAssignment.js`.
    - **Steps**:
      - In `src/services/roleAssignment.js`, add:
        ```javascript
        const { getRulesByGuild } = require('../database/models/rules');

        function assignRolesBasedOnNFT(nftData, guildId) {
          const rules = getRulesByGuild(guildId);
          const rolesToAssign = [];

          for (const rule of rules) {
            if (rule.type === 'quantity' && nftData.quantity >= parseInt(rule.value)) {
              rolesToAssign.push(rule.role_id);
            } else if (rule.type === 'serial') {
              const [min, max] = rule.value.split('-').map(Number);
              if (nftData.serials.some(serial => serial >= min && serial <= max)) {
                rolesToAssign.push(rule.role_id);
              }
            }
          }

          return rolesToAssign;
        }

        module.exports = { assignRolesBasedOnNFT };
        ```
    - **Test**: Test with mock NFT data (e.g., `{ quantity: 5, serials: [101] }`) and mock rules to confirm correct role IDs are returned.
    - **Output**: `src/services/roleAssignment.js`.

### Slash Commands

15. **Implement `/verify-wallet` Command**
    - **Description**: Create the `/verify-wallet` command logic in `verify.js`.
    - **Steps**:
      - In `src/commands/public/verify.js`, add:
        ```javascript
        const { SlashCommandBuilder } = require('discord.js');
        const { getNFTData } = require('../../services/hederaService');
        const { assignRolesBasedOnNFT } = require('../../services/roleAssignment');
        const { assignRole } = require('../../services/discordService');

        module.exports = {
          data: new SlashCommandBuilder()
            .setName('verify-wallet')
            .setDescription('Verify your Hedera wallet to get roles')
            .addStringOption(option =>
              option.setName('accountid')
                .setDescription('Your Hedera account ID (e.g., 0.0.1231234)')
                .setRequired(true)
            ),
          async execute(interaction) {
            await interaction.deferReply({ ephemeral: true });
            const accountId = interaction.options.getString('accountid');
            const nftData = await getNFTData(accountId);

            if (!nftData.ownsToken) {
              await interaction.editReply('No NFTs found for this wallet.');
              return;
            }

            const roles = assignRolesBasedOnNFT(nftData, interaction.guildId);
            for (const roleId of roles) {
              await assignRole(interaction.member, roleId);
            }

            await interaction.editReply(`Verified! Assigned ${roles.length} role(s).`);
          }
        };
        ```
    - **Test**: Deploy the command (after step 18) and test with a valid/invalid wallet ID to confirm role assignment and replies.
    - **Output**: `src/commands/public/verify.js`.

16. **Implement `/setup` Command**
    - **Description**: Create the `/setup` command for admins in `setup.js`.
    - **Steps**:
      - In `src/commands/admin/setup.js`, add:
        ```javascript
        const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

        module.exports = {
          data: new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Initialize bot for this server')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
          async execute(interaction) {
            await interaction.reply({ content: 'Bot setup complete!', ephemeral: true });
          }
        };
        ```
    - **Test**: Deploy the command (after step 18) and test with an admin user to confirm the reply.
    - **Output**: `src/commands/admin/setup.js`.

17. **Implement `/set-rules` Command**
    - **Description**: Create the `/set-rules` command for admins in `set-rules.js`.
    - **Steps**:
      - In `src/commands/admin/set-rules.js`, add:
        ```javascript
        const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
        const { addRule } = require('../../database/models/rules');

        module.exports = {
          data: new SlashCommandBuilder()
            .setName('set-rules')
            .setDescription('Set role assignment rules')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .addStringOption(option =>
              option.setName('type')
                .setDescription('Rule type (quantity or serial)')
                .setRequired(true)
                .addChoices(
                  { name: 'Quantity', value: 'quantity' },
                  { name: 'Serial', value: 'serial' }
                )
            )
            .addStringOption(option =>
              option.setName('value')
                .setDescription('Value (e.g., 5 for quantity, 100-200 for serial)')
                .setRequired(true)
            )
            .addRoleOption(option =>
              option.setName('role')
                .setDescription('Role to assign')
                .setRequired(true)
            ),
          async execute(interaction) {
            const type = interaction.options.getString('type');
            const value = interaction.options.getString('value');
            const role = interaction.options.getRole('role');
            addRule(type, value, role.id, interaction.guildId);
            await interaction.reply({ content: `Rule added: ${type} ${value} → ${role.name}`, ephemeral: true });
          }
        };
        ```
    - **Test**: Deploy the command (after step 18) and test with an admin user to add a rule, then verify it in the database.
    - **Output**: `src/commands/admin/set-rules.js`.

18. **Implement Command Deployment Script**
    - **Description**: Create a script to register slash commands in `deploy-commands.js`.
    - **Steps**:
      - In `src/deploy-commands.js`, add:
        ```javascript
        const { REST, Routes } = require('discord.js');
        const fs = require('fs');
        const path = require('path');
        require('dotenv').config();

        const commands = [];
        const commandFolders = ['public', 'admin'];
        for (const folder of commandFolders) {
          const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
          for (const file of commandFiles) {
            const command = require(`./commands/${folder}/${file}`);
            commands.push(command.data.toJSON());
          }
        }

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        (async () => {
          try {
            console.log('Registering slash commands...');
            await rest.put(
              Routes.applicationCommands('YOUR_CLIENT_ID'),
              { body: commands }
            );
            console.log('Commands registered successfully!');
          } catch (error) {
            console.error('Error registering commands:', error);
          }
        })();
        ```
      - Replace `YOUR_CLIENT_ID` with the bot’s client ID from the Discord Developer Portal.
    - **Test**: Run `node src/deploy-commands.js` and confirm commands appear in Discord.
    - **Output**: `src/deploy-commands.js`.

### Deployment

19. **Create Railway Configuration**
    - **Description**: Set up `railway.yml` for deployment.
    - **Steps**:
      - In `railway.yml`, add:
        ```yaml
        services:
          - name: discord-nft-bot
            type: web
            buildCommand: npm install
            startCommand: npm start
            envVars:
              - key: DISCORD_TOKEN
                sync: false
              - key: HEDERA_MIRROR_NODE_URL
                value: https://mainnet-public.mirrornode.hedera.com
              - key: DATABASE_PATH
                value: /app/data.db
        ```
    - **Test**: Validate the YAML syntax using a YAML linter.
    - **Output**: `railway.yml`.

20. **Add Start Script**
    - **Description**: Update `package.json` with a start script.
    - **Steps**:
      - In `package.json`, add:
        ```json
        {
          "scripts": {
            "start": "node src/bot.js",
            "deploy": "node src/deploy-commands.js"
          }
        }
        ```
    - **Test**: Run `npm start` to confirm the bot starts locally.
    - **Output**: Updated `package.json`.

21. **Deploy to Railway.app**
    - **Description**: Deploy the bot to Railway.app.
    - **Steps**:
      - Initialize a git repository: `git init`.
      - Commit all files: `git add . && git commit -m "Initial commit"`.
      - Link to Railway: `railway link`.
      - Deploy: `railway up`.
      - Set environment variables in Railway’s dashboard.
    - **Test**: Confirm the bot is online in Discord and responds to commands.
    - **Output**: Deployed application on Railway.app.

## Testing Guidelines
- **Unit Testing**: For each task, test the output in isolation (e.g., run a script to verify database operations or API calls).
- **Integration Testing**: After completing command-related tasks (steps 15-18), test commands in a Discord server with a test bot.
- **Manual Testing**: Use a valid Hedera wallet ID and test roles in a Discord server to verify end-to-end functionality.
- **Error Handling**: Ensure logs (via `logger.js`, to be implemented if needed) capture errors for debugging.

This plan breaks the MVP into 21 small, testable tasks, each focused on a single concern. Each task produces a verifiable output, enabling incremental development and testing. Let me know if you need further refinements or additional details for any task!