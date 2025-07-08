const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-help')
    .setDescription('Get help and instructions for SLIME NFT giveaways'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const helpEmbed = new EmbedBuilder()
        .setColor('#00ff40')
        .setTitle('🎁 SLIME Giveaway Help')
        .setDescription('Everything you need to know about participating in SLIME NFT giveaways!')
        .addFields(
          {
            name: '📋 Requirements',
            value: '• Must have a verified Hedera wallet\n' +
                   '• Must own at least 1 SLIME NFT\n' +
                   '• Use `/verify-wallet` if not already verified',
            inline: false
          },
          {
            name: '🎫 How Tickets Work',
            value: '• Each SLIME NFT you own = 1 raffle ticket\n' +
                   '• More NFTs = better chances to win\n' +
                   '• Ticket count updates when you enter',
            inline: false
          },
          {
            name: '🎯 How to Participate',
            value: '1. Wait for admin to start a giveaway\n' +
                   '2. Use `/enter-giveaway` to participate\n' +
                   '3. Check status with `/giveaway-status`\n' +
                   '4. Wait for the drawing!',
            inline: false
          },
          {
            name: '⏰ Giveaway Durations',
            value: 'Admins can set giveaways for:\n' +
                   '• 5 minutes (testing)\n' +
                   '• 30 minutes, 1 hour\n' +
                   '• 12 hours, 24 hours, 48 hours',
            inline: false
          },
          {
            name: '🏆 Winning & Prizes',
            value: '• Winners are selected randomly (weighted by tickets)\n' +
                   '• SLIME NFT is automatically sent to your wallet\n' +
                   '• No manual claiming required!',
            inline: false
          },
          {
            name: '❓ Common Questions',
            value: '**Q: Can I enter multiple times?**\n' +
                   'A: No, one entry per giveaway (but ticket count updates)\n\n' +
                   '**Q: What if I buy more NFTs after entering?**\n' +
                   'A: Enter again to update your ticket count!\n\n' +
                   '**Q: When do I receive my prize?**\n' +
                   'A: Immediately when giveaway ends (automatic)',
            inline: false
          }
        )
        .setFooter({
          text: 'Need more help? Ask an admin!',
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
