const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');
const AutoScanner = require('./services/autoScanner');
const HederaMirrorMonitor = require('./services/hederaMirrorMonitor');
const DailyMessage = require('./services/dailyMessage');
const FaucetService = require('./services/faucetService');
const fs = require('fs');
const path = require('path');
// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// Deploy commands function
async function deployCommands() {
  try {
    console.log('🔄 Deploying slash commands...');

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

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID_HERE'),
      { body: commands }
    );

    console.log(`✅ Successfully deployed ${commands.length} slash commands!`);
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

client.once('ready', async () => {
  console.log(`✅ Bot successfully logged in as ${client.user.tag}`);

  // Deploy commands automatically on startup
  await deployCommands();

  console.log(`🚀 Bot is ready and running!`);

  // Start automatic scanner
  const scanner = new AutoScanner(client);
  scanner.start();

  // Start Hedera Mirror sales monitor
  const salesMonitor = new HederaMirrorMonitor(client);
  salesMonitor.start();

  // Start daily message service
  const dailyMessage = new DailyMessage(client);
  dailyMessage.start();

  // Start faucet service
  const faucetService = new FaucetService(client);
  client.faucetService = faucetService; // Make accessible to commands
});

// Welcome message when new members join
client.on('guildMemberAdd', async (member) => {
  try {
    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID || 'YOUR_WELCOME_CHANNEL_ID_HERE';
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

    if (welcomeChannel) {
      const welcomeMessage = `Welcome ${member} to **${member.guild.name}**!\n\nUse \`/verify-wallet\` to verify your SLIME NFTs and get your roles!`;

      await welcomeChannel.send(welcomeMessage);
      console.log(`✅ Welcome message sent for ${member.user.tag}`);
    } else {
      console.log(`❌ Welcome channel not found: ${welcomeChannelId}`);
    }
  } catch (error) {
    console.error('❌ Error sending welcome message:', error);
  }
});

// Load commands
const commands = new Map();

// Load public commands
const publicCommandFiles = fs.readdirSync('./src/commands/public').filter(file => file.endsWith('.js'));
for (const file of publicCommandFiles) {
  const command = require(`./commands/public/${file}`);
  commands.set(command.data.name, command);
}

// Load admin commands
const adminCommandFiles = fs.readdirSync('./src/commands/admin').filter(file => file.endsWith('.js'));
for (const file of adminCommandFiles) {
  const command = require(`./commands/admin/${file}`);
  commands.set(command.data.name, command);
}

// Handle embed modal submissions
async function handleEmbedModal(interaction) {
  try {
    // Parse the custom ID to get user ID
    const [, , userId] = interaction.customId.split('_');

    // Verify the user matches
    if (userId !== interaction.user.id) {
      await interaction.reply({ content: '❌ You can only submit your own embed forms!', ephemeral: true });
      return;
    }

    // Get form values
    const title = interaction.fields.getTextInputValue('embed_title');
    const description = interaction.fields.getTextInputValue('embed_description');
    const options = interaction.fields.getTextInputValue('embed_options') || '';
    const colorAndFooter = interaction.fields.getTextInputValue('embed_color') || '';
    const imageUrl = interaction.fields.getTextInputValue('embed_image');

    // Parse options (channel and pin)
    let targetChannel = interaction.channel;
    let shouldPin = false;

    if (options.trim()) {
      const optionsParts = options.trim().split(' ');

      // Look for channel mention
      const channelMention = optionsParts.find(part => part.startsWith('#'));
      if (channelMention) {
        const channelName = channelMention.slice(1);
        const foundChannel = interaction.guild.channels.cache.find(ch => ch.name === channelName);
        if (foundChannel) {
          targetChannel = foundChannel;
        }
      }

      // Look for pin option
      if (optionsParts.includes('pin')) {
        shouldPin = true;
      }
    }

    // Parse color and footer
    let color = '#00ff40';
    let footer = '';

    if (colorAndFooter.trim()) {
      if (colorAndFooter.includes('|')) {
        const [colorPart, footerPart] = colorAndFooter.split('|').map(s => s.trim());
        if (colorPart) color = colorPart;
        if (footerPart) footer = footerPart;
      } else {
        // Just color or just footer
        if (colorAndFooter.startsWith('#')) {
          color = colorAndFooter.trim();
        } else {
          footer = colorAndFooter.trim();
        }
      }
    }

    // Create the embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color);

    // Add footer with username
    const footerText = footer ? footer : `Created by ${interaction.user.username}`;
    embed.setFooter({
      text: footerText,
      iconURL: interaction.user.displayAvatarURL()
    });

    if (imageUrl) {
      try {
        embed.setImage(imageUrl);
      } catch (error) {
        console.log('Invalid image URL provided');
      }
    }

    // Send the embed
    const sentMessage = await targetChannel.send({ embeds: [embed] });

    // Pin if requested
    if (shouldPin) {
      try {
        await sentMessage.pin();
      } catch (pinError) {
        console.error('Failed to pin message:', pinError);
      }
    }

    // Success response
    let successMessage = `✅ **Embed sent successfully!**\n\n`;
    successMessage += `📍 **Channel:** ${targetChannel}\n`;
    successMessage += `📝 **Title:** ${title}\n`;
    if (shouldPin) successMessage += `📌 **Pinned:** Yes\n`;
    successMessage += `🔗 **[Jump to Message](${sentMessage.url})**`;

    await interaction.reply({ content: successMessage, ephemeral: true });

    console.log(`✅ Embed created via modal by ${interaction.user.tag} in ${targetChannel.name}`);

  } catch (error) {
    console.error('❌ Error handling embed modal:', error);
    await interaction.reply({
      content: 'Sorry, there was an error creating the embed. Please try again.',
      ephemeral: true
    });
  }
}

client.on('interactionCreate', async (interaction) => {
  // Handle slash commands
  if (interaction.isCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      console.log(`🔧 Executing command: ${interaction.commandName} by ${interaction.user.tag}`);
      await command.execute(interaction);
    } catch (error) {
      console.error('❌ Error executing command:', error);
      const errorMessage = 'There was an error while executing this command!';

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }

  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('embed_modal_')) {
      await handleEmbedModal(interaction);
    }
  }
});

// Debug environment variables
console.log('🔍 Environment check:');
console.log('DISCORD_TOKEN exists:', !!process.env.DISCORD_TOKEN);
console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);

if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN environment variable is not set!');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
  console.error('❌ Failed to login to Discord:', error.message);
  process.exit(1);
});
