const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getRulesByGuild } = require('../../database/models/rules');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with verification and see server rules'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      // Get all rules from database for this guild
      const rules = await getRulesByGuild(interaction.guildId);

      // Create help embed
      const helpEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('🆘 Slime Bot Help')
        .setDescription('Here\'s how to verify your wallet and see the current rules:')
        .addFields(
          {
            name: '🔐 Wallet Verification',
            value: 'Use `/verify-wallet` to connect your Hedera wallet and get roles based on your SLIME NFTs!\n\n' +
                   '**Example:** `/verify-wallet accountid:0.0.1231234`',
            inline: false
          }
        );

      // Add rules section
      if (rules.length > 0) {
        let rulesText = '';
        rules.forEach((rule, index) => {
          const ruleNumber = index + 1;
          const role = interaction.guild.roles.cache.get(rule.role_id);
          const roleName = role ? role.name : 'Unknown Role';

          if (rule.type === 'quantity') {
            rulesText += `**${ruleNumber}.** Own **${rule.value}+ SLIME NFTs** → Get **${roleName}** role\n`;
          } else if (rule.type === 'serial') {
            rulesText += `**${ruleNumber}.** Own **SLIME #${rule.value}** → Get **${roleName}** role\n`;
          }
        });

        helpEmbed.addFields({
          name: '📋 Current Rules',
          value: rulesText || 'No rules configured yet.',
          inline: false
        });
      } else {
        helpEmbed.addFields({
          name: '📋 Current Rules',
          value: 'No rules have been set up yet. Admins can use `/set-rules` to create verification rules.',
          inline: false
        });
      }

      // Add footer with additional info
      helpEmbed.addFields(
        {
          name: '🎯 SLIME Token Info',
          value: 'Token ID: `0.0.8357917`\nNetwork: Hedera Mainnet',
          inline: true
        },
        {
          name: '🔄 Auto-Updates',
          value: 'Your roles are automatically updated every 30 minutes!',
          inline: true
        },
        {
          name: '📊 Check Your Status',
          value: 'Use `/status` to see if your wallet is verified!',
          inline: true
        }
      );

      helpEmbed.setFooter({ 
        text: 'Need more help? Contact an admin!',
        iconURL: interaction.client.user.displayAvatarURL()
      });

      await interaction.editReply({ embeds: [helpEmbed] });

      console.log(`✅ Help command used by ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Error in help command:', error);
      
      const errorMessage = 'Sorry, there was an error retrieving help information. Please try again or contact an admin.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};
