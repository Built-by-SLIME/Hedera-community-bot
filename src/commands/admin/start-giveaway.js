const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start-giveaway')
    .setDescription('Start a SLIME NFT giveaway (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('How long the giveaway should run')
        .setRequired(true)
        .addChoices(
          { name: '5 minutes', value: '5min' },
          { name: '30 minutes', value: '30min' },
          { name: '1 hour', value: '1hr' },
          { name: '12 hours', value: '12hr' },
          { name: '24 hours', value: '24hr' },
          { name: '48 hours', value: '48hr' }
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const duration = interaction.options.getString('duration');

      // Get faucet service from bot client
      const faucetService = interaction.client.faucetService;
      if (!faucetService) {
        await interaction.editReply({
          content: '❌ Faucet service not available. Please contact bot administrator.'
        });
        return;
      }

      // Start the giveaway
      const result = await faucetService.startGiveaway(
        interaction.guildId,
        interaction.channelId,
        duration,
        interaction.user
      );

      if (!result.success) {
        await interaction.editReply({
          content: result.message
        });
        return;
      }

      // Send the giveaway announcement
      await interaction.editReply({
        content: '✅ **Giveaway Started Successfully!**\n\n@everyone A new SLIME NFT giveaway has begun!',
        embeds: [result.embed],
        allowedMentions: { parse: ['everyone'] }
      });

      console.log(`🎁 Giveaway started by ${interaction.user.tag} in ${interaction.guild.name} for ${duration}`);

    } catch (error) {
      console.error('❌ Error in start-giveaway command:', error);
      await interaction.editReply({
        content: '❌ **Error starting giveaway.** Please try again later.'
      });
    }
  }
};
