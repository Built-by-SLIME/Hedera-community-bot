const cron = require('node-cron');

class DailyMessage {
  constructor(client) {
    this.client = client;
    this.channelId = '1390767953825239202';
    this.isRunning = false;
    
    // Array of daily messages to randomly select from
    this.messages = [
      'GM Slime! Today\'s Hedera Highlight is on Altlantis - They provide free tools for grassroots creators with no fees! - https://altlantis.tools/',
      'Gm Slime! Today\'s Hedera Highlight is on Please Don\'t Stare - Check out token analytics, such as top holders and their transactions - https://pleasedontstare.xyz/app/tools/tt/',
      'Gm Slime! Today\'s Hedera Highlight is on HashPack - Explore the Hedera ecosystem with the best wallet in Web3 - https://www.hashpack.app/download',
      'Gm Slime! Today\'s Hedera Highlight is on Viva Carta - They are builders looking to reshape the NFT space, and Hedera eco-system. Check them out here - https://x.com/THEVIVACARTA',
      'Gm Slime! Today\'s Hedera Highlight is on ART! - Whether Pixel art like - https://x.com/deadpixels_club or hand-drawn like - https://x.com/HangryBarboons - Hedera has something for every collector!',
      'Gm Slime! Today\'s Hedera Highlight is on Grims - Relentless building innovative tools, and art for the whole ecosystem - https://x.com/hashinalgrims',
      'Gm Slime! Today\'s Hedera highlight is on BSLD - Builders + AI = Securing the Hashgraph. Learn more - https://x.com/BSLDefender',
      'Gm Slime! Today\'s Hedera Highlight is on The Hedera Foundation - They provide source code and SDKs. driving innovation and raising awareness about Hedera - https://hedera.foundation/',
      'Gm Slime! Today\'s Hedera Highlight is on the Hedera Marketplaces - SentX and Kabila - Buy, Sell, and transfer NFTs with ease - https://sentx.io/ & https://www.kabila.app/market',
      'Gm Slime! Today\'s Hedera Highlight is on $GIB - The official meme coin of the Hedera Foundation. Join the Gibolution - https://x.com/gib_plz',
      'Gm Slime! Today\'s Hedera Highlight is on Wild Tigers - Mixing Web3 and IRL products, Wild tigers is an active community on Hedera and working on expanding out to other chains - https://x.com/wildtigers_nft',
      'Gm Slime! Today\'s Hedera Highlight is on the Hunger Fighters - Leveraging crypto to feed people in impoverished cities - https://x.com/HFighters24',
      'Gm Slime! Today\'s Hedera Highlight is on Memejob.fun, a token launching platform built for Hedera. Join the fun - https://memejob.fun/',
      'Gm Slime! Today\'s Hedera Highlight is on Starfall V - An interactive comic allowing readers to vote on the story using $STAR tokens - https://x.com/SFVHbar',
      'Gm Slime! Today\'s Hedera Highlight is on HonkBot - A telegram trading bot built specifically for Hedera Hashgraph. Become a degen - https://x.com/HonkHbar'
    ];
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Daily message service is already running');
      return;
    }

    // Schedule daily message at 8 AM EST (1 PM UTC)
    this.cronJob = cron.schedule('0 13 * * *', async () => {
      await this.sendDailyMessage();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.isRunning = true;
    console.log('📅 Daily message service started - sending at 8 AM EST daily');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.isRunning = false;
      console.log('⏹️ Daily message service stopped');
    }
  }

  async sendDailyMessage() {
    try {
      const channel = this.client.channels.cache.get(this.channelId);
      if (!channel) {
        console.error(`❌ Daily message channel ${this.channelId} not found`);
        return;
      }

      // Select random message from array
      const randomIndex = Math.floor(Math.random() * this.messages.length);
      const selectedMessage = this.messages[randomIndex];

      await channel.send(selectedMessage);
      console.log(`✅ Daily GM message sent (message #${randomIndex + 1})`);
      
    } catch (error) {
      console.error('❌ Error sending daily message:', error);
    }
  }

  // Manual trigger for testing
  async testDailyMessage() {
    console.log('🔧 Manual daily message test triggered');
    await this.sendDailyMessage();
  }
}

module.exports = DailyMessage;
