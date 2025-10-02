const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-help')
    .setDescription('Get help and instructions for NFT giveaways'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // TODO: Customize this giveaway help message for your community
      const helpEmbed = new EmbedBuilder()
        .setColor('#00ff40') // Customize this color for your brand
        .setTitle('🎁 NFT Giveaway - How It Works')
        .setDescription('Everything you need to know about participating in community NFT giveaways!')
        .addFields(
          {
            name: '📋 Entry Requirements',
            value: '✅ Must have a verified Hedera wallet (use `/verify-wallet`)\n' +
                   '✅ Must own at least 1 NFT from the collection\n' +
                   '✅ Giveaway must be active (check with `/giveaway-status`)',
            inline: false
          },
          {
            name: '🎫 Raffle Ticket System',
            value: '**How it works:**\n' +
                   '• Each NFT you own = 1 raffle ticket\n' +
                   '• More NFTs = higher chance to win\n' +
                   '• Ticket count automatically updates when you enter\n\n' +
                   '**Example:** Own 5 NFTs = 5 tickets = 5x the chance!',
            inline: false
          },
          {
            name: '🎯 How to Participate',
            value: '**Step-by-step:**\n' +
                   '1️⃣ Wait for an admin to announce a giveaway\n' +
                   '2️⃣ Use `/enter-giveaway` to join\n' +
                   '3️⃣ Check your status with `/giveaway-status`\n' +
                   '4️⃣ Wait for the automatic drawing!',
            inline: false
          },
          {
            name: '⏰ Giveaway Duration Options',
            value: 'Admins can set giveaways to run for:\n' +
                   '• **Quick:** 5 minutes (testing)\n' +
                   '• **Short:** 30 minutes or 1 hour\n' +
                   '• **Long:** 12 hours, 24 hours, or 48 hours',
            inline: false
          },
          {
            name: '🏆 Winner Selection & Prizes',
            value: '**How winners are chosen:**\n' +
                   '• Random selection weighted by ticket count\n' +
                   '• More tickets = better odds\n\n' +
                   '**Prize delivery:**\n' +
                   '• NFT sent automatically to your verified wallet\n' +
                   '• No manual claiming needed!',
            inline: false
          },
          {
            name: '❓ Frequently Asked Questions',
            value: '**Q: Can I enter multiple times?**\n' +
                   'A: No, but you can re-enter to update your ticket count if you acquire more NFTs.\n\n' +
                   '**Q: What if I buy more NFTs after entering?**\n' +
                   'A: Simply use `/enter-giveaway` again to update your ticket count!\n\n' +
                   '**Q: When do I receive my prize if I win?**\n' +
                   'A: Immediately and automatically when the giveaway ends.',
            inline: false
          }
        )
        .setFooter({
          text: 'Good luck! Need help? Contact a server admin.',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [helpEmbed] });

      console.log(`ℹ️ Giveaway help requested by ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Error in giveaway-help command:', error);
      await interaction.editReply({
        content: '❌ **Error loading help.** Please try again later.'
      });
    }
  }
};
