# Discord NFT Verification Bot Architecture

This document outlines the architecture for a Discord bot that verifies NFT ownership on the Hedera network using the Hedera Mirror Node REST API, assigns roles based on token quantity and serial numbers, and is managed via Discord slash commands. The bot is built with Node.js, uses Discord.js for Discord integration, SQLite for storage, and is hosted on Railway.app.

## Table of Contents
- [Overview](#overview)
- [File and Folder Structure](#file-and-folder-structure)
- [Architecture Details](#architecture-details)
  - [State Management](#state-management)
  - [Service Connections](#service-connections)
- [Key Components and Responsibilities](#key-components-and-responsibilities)
- [Data Flow](#data-flow)
- [Environment Variables](#environment-variables)
- [Deployment Considerations](#deployment-considerations)

## Overview

The bot is a single Node.js application that:
- Integrates with Discord via Discord.js for slash commands and role management.
- Queries the Hedera Mirror Node REST API to verify NFT ownership (token ID: `0.0.8357917`).
- Stores configuration rules in a PostgreSQL database for production persistence.
- Assigns Discord roles based on token quantity and serial numbers.
- Provides admin configuration via Discord slash commands (e.g., `/setup`).
- Runs on Railway.app for hosting with persistent PostgreSQL storage.

The application is modular, with separate concerns for Discord interactions, Hedera API calls, database operations, and role assignment logic.

## File and Folder Structure

Below is the proposed file and folder structure for the bot:

```plaintext
discord-nft-bot/
├── src/
│   ├── commands/
│   │   ├── public/
│   │   │   ├── verify.js           # /verify-wallet command logic
│   │   ├── admin/
│   │   │   ├── setup.js           # /setup command for admins
│   │   │   ├── set-rules.js       # Command to set role rules
│   │
│   ├── services/
│   │   ├── hederaService.js       # Hedera Mirror Node API interactions
│   │   ├── discordService.js      # Discord role and member management
│   │   ├── roleAssignment.js      # Logic for assigning roles based on rules
│   │
│   ├── database/
│   │   ├── db.js                 # SQLite database setup and connection
│   │   ├── models/
│   │   │   ├── rules.js          # Database operations for rules table
│   │
│   ├── utils/
│   │   ├── logger.js             # Logging utility
│   │   ├── constants.js          # Constants (e.g., token ID, API endpoints)
│   │
│   ├── bot.js                    # Bot initialization and event handlers
│   ├── deploy-commands.js        # Script to register slash commands
│
├── .env                          # Environment variables
├── package.json                  # Node.js dependencies and scripts
├── README.md                     # Project documentation
├── .gitignore                    # Git ignore file
├── railway.yml                   # Railway.app configuration
```

### File Descriptions
- **src/commands/public/verify.js**: Handles the `/verify-wallet` slash command, taking a wallet address (e.g., `0.0.1231234`) and triggering the verification process.
- **src/commands/admin/setup.js**: Admin-only command to initialize bot settings (e.g., linking to a Discord server).
- **src/commands/admin/set-rules.js**: Admin command to define role assignment rules based on NFT quantity or serial numbers.
- **src/services/hederaService.js**: Encapsulates Hedera Mirror Node API calls to fetch NFT ownership, quantity, and serial numbers for a given wallet.
- **src/services/discordService.js**: Manages Discord interactions like assigning/removing roles and fetching member data.
- **src/services/roleAssignment.js**: Contains logic to map NFT holdings (quantity/serial) to Discord roles based on stored rules.
- **src/database/db.js**: Initializes and manages the SQLite database connection.
- **src/database/models/rules.js**: Defines database operations for the rules table (e.g., CRUD for role mappings).
- **src/utils/logger.js**: Utility for logging bot activity and errors.
- **src/utils/constants.js**: Stores static values like the NFT token ID (`0.0.8357917`) and API endpoints.
- **src/bot.js**: Entry point for the bot, handling Discord client initialization and event listeners.
- **src/deploy-commands.js**: Script to register slash commands with Discord.
- **.env**: Stores sensitive configuration (e.g., Discord token, Hedera API endpoints).
- **package.json**: Defines dependencies (`discord.js`, `better-sqlite3`, `axios`) and scripts.
- **railway.yml**: Configuration for deploying on Railway.app.

## Architecture Details

### State Management
- **Database (PostgreSQL)**:
  - Stores a `rules` table with mappings for role assignments based on NFT quantity and serial numbers.
  - Example schema:
    ```sql
    CREATE TABLE rules (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL, -- 'quantity' or 'serial'
      value VARCHAR(255) NOT NULL, -- e.g., '5' for quantity or '100-200' for serial range
      role_id VARCHAR(255) NOT NULL, -- Discord role ID
      guild_id VARCHAR(255) NOT NULL, -- Discord server ID
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```
  - Managed via `pg` (PostgreSQL client) in `src/database/db.js` and `src/database/models/rules.js`.
  - Hosted on Railway.app's managed PostgreSQL service for persistence across deployments.
  - Falls back to SQLite for local development when `DATABASE_URL` is not present.
- **Runtime State**:
  - Discord client state (e.g., guild and member data) is managed by `discord.js`.
  - Temporary state (e.g., API responses) is held in memory during command execution.
- **Configuration**:
  - Environment variables in `.env` for sensitive data (e.g., Discord token, Hedera API URL).
  - Bot settings (e.g., guild-specific rules) are stored in the SQLite database.

### Service Connections
- **Discord.js**:
  - Connects to the Discord API using a bot token.
  - Handles slash commands, role assignments, and member interactions.
  - Events like `interactionCreate` trigger command execution.
- **Hedera Mirror Node REST API**:
  - Queries the Hedera Mirror Node to fetch NFT data for a wallet (e.g., `/api/v1/accounts/{accountId}/nfts?token.id=0.0.8357917`).
  - Uses `axios` for HTTP requests.
  - Handles rate limits and error responses.
- **PostgreSQL**:
  - Managed database service on Railway.app for storing role assignment rules.
  - Accessed via `pg` client for production persistence.
  - Automatically scales and provides backups through Railway's managed service.
- **Railway.app**:
  - Hosts the Node.js application and SQLite database.
  - Manages environment variables and scaling.

## Key Components and Responsibilities

1. **Bot Initialization (`src/bot.js`)**
   - Initializes the Discord.js client and connects to Discord.
   - Sets up event listeners for `ready` (bot startup) and `interactionCreate` (slash commands).
   - Loads commands from `src/commands/`.

2. **Command Handling (`src/commands/`)**
   - **Public Commands**:
     - `/verify-wallet <accountId>`: Triggers NFT verification for a user’s wallet.
       - Calls `hederaService` to fetch NFT data.
       - Uses `roleAssignment` to determine roles.
       - Updates roles via `discordService`.
   - **Admin Commands**:
     - `/setup`: Initializes bot settings for a guild (e.g., stores guild ID).
     - `/set-rules`: Allows admins to define role mappings (e.g., "5+ NFTs → VIP role").
       - Updates the `rules` table in SQLite.

3. **Hedera Service (`src/services/hederaService.js`)**
   - Queries the Hedera Mirror Node API to:
     - Confirm ownership of token ID `0.0.8357917`.
     - Fetch the quantity of NFTs held.
     - Retrieve serial numbers of NFTs.
   - Example API call:
     ```javascript
     const response = await axios.get(
       `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${accountId}/nfts?token.id=0.0.8357917`
     );
     ```
   - Returns parsed data (e.g., `{ ownsToken: true, quantity: 5, serials: [101, 102, 103] }`).

4. **Discord Service (`src/services/discordService.js`)**
   - Manages Discord roles and members.
   - Functions:
     - Assign/remove roles: `member.roles.add(roleId)` or `member.roles.remove(roleId)`.
     - Fetch guild roles and members.
     - Validate admin permissions for `/setup` and `/set-rules`.

5. **Role Assignment (`src/services/roleAssignment.js`)**
   - Maps NFT data to roles based on rules in the SQLite database.
   - Logic:
     - For quantity: Check rules like `quantity >= 5 → assign VIP role`.
     - For serials: Check rules like `serial in 100-200 → assign Rare role`.
   - Returns a list of role IDs to assign.

6. **Database Operations (`src/database/`)**
   - `db.js`: Initializes PostgreSQL connection (production) or SQLite (development) and creates the `rules` table.
   - `models/rules.js`: Provides CRUD operations for rules (e.g., `addRule`, `getRulesByGuild`) with support for both PostgreSQL and SQLite.

7. **Utilities (`src/utils/`)**
   - `logger.js`: Logs bot activity (e.g., command execution, errors) to console/file.
   - `constants.js`: Stores constants like `TOKEN_ID = '0.0.8357917'` and API URLs.

8. **Command Deployment (`src/deploy-commands.js`)**
   - Registers slash commands with Discord using the REST API.
   - Run during deployment or manually via `npm run deploy`.

## Data Flow

1. **User Joins Discord Server**:
   - User has no roles initially.
2. **User Executes `/verify-wallet 0.0.1231234`**:
   - Discord.js triggers `interactionCreate` in `bot.js`.
   - `verify.js` command handler validates input and calls `hederaService`.
3. **Hedera API Query**:
   - `hederaService` queries the Mirror Node API for the wallet’s NFT data.
   - Returns ownership status, quantity, and serial numbers.
4. **Role Assignment**:
   - `roleAssignment` fetches rules from SQLite via `rules.js`.
   - Maps NFT data to roles (e.g., 5 NFTs → VIP role, serial 101 → Rare role).
5. **Role Update**:
   - `discordService` assigns/removes roles for the user.
   - Sends a confirmation message to the user.
6. **Admin Configuration**:
   - Admins use `/setup` to initialize the bot for the guild.
   - Admins use `/set-rules` to define role mappings, stored in SQLite.

## Environment Variables

Stored in `.env`:

```plaintext
DISCORD_TOKEN=your_discord_bot_token
HEDERA_MIRROR_NODE_URL=https://mainnet-public.mirrornode.hedera.com
DATABASE_PATH=./data.db
```

- `DISCORD_TOKEN`: Discord bot token for authentication.
- `HEDERA_MIRROR_NODE_URL`: Base URL for Hedera Mirror Node API.
- `DATABASE_PATH`: Path to SQLite database file.

## Deployment Considerations

- **Railway.app**:
  - Deploy the Node.js app using `railway.yml`.
  - Ensure SQLite file (`data.db`) is persisted using Railway’s volume storage.
  - Set environment variables in Railway’s dashboard.
- **Dependencies** (`package.json`):
  ```json
  {
    "dependencies": {
      "discord.js": "^14.14.1",
      "pg": "^8.11.3",
      "sqlite3": "^5.1.6",
      "axios": "^1.7.2",
      "dotenv": "^17.0.0"
    },
    "scripts": {
      "start": "node src/bot.js",
      "deploy": "node src/deploy-commands.js"
    }
  }
  ```
- **Scaling**:
  - Railway.app handles scaling automatically.
  - Monitor Hedera API rate limits to avoid throttling.
- **Security**:
  - Restrict `/setup` and `/set-rules` to users with admin permissions.
  - Validate wallet address input to prevent API abuse.
  - Use HTTPS for all API calls.
