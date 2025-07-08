const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
// Load dotenv if available (for local development)
try {
  require('dotenv').config();
} catch (error) {
  // dotenv not available or no .env file - that's fine for production
}

const commands = [];
const commandFolders = ['public', 'admin'];
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
  console.log(`📁 Found ${commandFiles.length} files in ${folder}:`, commandFiles);
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    console.log(`✅ Loaded command: ${command.data.name}`);
    commands.push(command.data.toJSON());
  }
}
console.log(`🎯 Total commands to register: ${commands.length}`);

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN environment variable not found!');
  console.log('💡 This script needs to run in an environment with DISCORD_TOKEN set.');
  console.log('💡 Commands are deployed automatically when the bot starts in production.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID_HERE'),
      { body: commands }
    );
    console.log('Commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
