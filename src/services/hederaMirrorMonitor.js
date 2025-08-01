const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const { TOKEN_ID } = require('../utils/constants');

class HederaMirrorMonitor {
  constructor(client) {
    this.client = client;
    this.baseUrl = 'https://mainnet-public.mirrornode.hedera.com';
    this.salesChannelId = '1371679527566049370';
    // Start checking from 1 hour ago to catch recent sales
    this.lastCheckedTimestamp = Date.now() - (60 * 60 * 1000);
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Hedera Mirror monitor is already running');
      return;
    }

    // Check for sales every 2 minutes
    this.interval = setInterval(async () => {
      await this.checkForNewSales();
    }, 2 * 60 * 1000);

    this.isRunning = true;
    console.log('📈 Hedera Mirror sales monitor started - checking every 2 minutes');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isRunning = false;
      console.log('⏹️ Hedera Mirror sales monitor stopped');
    }
  }

  async checkForNewSales() {
    try {
      console.log('🔍 Checking for new NFT sales...');

      // Get recent CRYPTOTRANSFER transactions and filter for our token
      const endpoint = `/api/v1/transactions?transactiontype=CRYPTOTRANSFER&order=desc&limit=100`;

      const response = await axios.get(`${this.baseUrl}${endpoint}`);
      if (response.status === 200) {
        console.log(`✅ Successfully fetched transactions from Hedera Mirror Node`);
        await this.processTransactions(response.data);
      }

    } catch (error) {
      console.error('❌ Error checking for sales:', error.message);
    }
  }

  async processTransactions(data) {
    try {
      const transactions = data.transactions || [];
      console.log(`📊 Found ${transactions.length} recent transactions`);

      // Filter for transactions involving our token
      let salesFound = 0;
      for (const transaction of transactions) {
        const sale = await this.analyzeTransaction(transaction);
        if (sale) salesFound++;
      }

      console.log(`🎯 Found ${salesFound} sales in this batch`);

    } catch (error) {
      console.error('❌ Error processing transactions:', error);
    }
  }

  async analyzeTransaction(transaction) {
    try {
      // Check if this transaction involves our token
      const tokenTransfers = transaction.token_transfers || [];
      const nftTransfers = transaction.nft_transfers || [];

      const ourTokenTransfers = [...tokenTransfers, ...nftTransfers].filter(transfer =>
        transfer.token_id === TOKEN_ID
      );

      if (ourTokenTransfers.length === 0) {
        return false; // Not our token
      }

      const transactionTime = new Date(parseFloat(transaction.consensus_timestamp) * 1000);

      // Only process transactions newer than our last check
      if (transactionTime.getTime() <= this.lastCheckedTimestamp) {
        return false;
      }

      // Look for HBAR transfers (indicating payment)
      const hbarTransfers = transaction.transfers || [];

      // Collect all sales in this transaction
      const salesInTransaction = [];
      for (const nftTransfer of ourTokenTransfers) {
        if (nftTransfer.serial_number) {
          const sale = this.detectSale(nftTransfer, hbarTransfers);
          if (sale) {
            salesInTransaction.push(sale);
          }
        }
      }

      // If we found sales, send a batch notification
      if (salesInTransaction.length > 0) {
        console.log(`🎉 BATCH SALE DETECTED! ${salesInTransaction.length} NFTs`);

        await this.sendSaleNotification({
          sales: salesInTransaction,
          timestamp: transactionTime,
          transactionId: transaction.transaction_id
        });

        // Update last checked timestamp
        this.lastCheckedTimestamp = Math.max(this.lastCheckedTimestamp, transactionTime.getTime());
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Error analyzing transaction:', error);
      return false;
    }
  }

  detectSale(nftTransfer, hbarTransfers) {
    try {
      const serialNumber = nftTransfer.serial_number;
      const nftSender = nftTransfer.sender_account_id;
      const nftReceiver = nftTransfer.receiver_account_id;

      // Skip if missing required fields
      if (!serialNumber || !nftSender || !nftReceiver || nftSender === nftReceiver) {
        return null;
      }

      // Look for HBAR payment from buyer to seller
      const payment = hbarTransfers.find(transfer =>
        transfer.account === nftReceiver && transfer.amount < 0
      );

      const receipt = hbarTransfers.find(transfer =>
        transfer.account === nftSender && transfer.amount > 0
      );

      // If we have both payment and receipt, it's a sale
      if (payment && receipt && Math.abs(payment.amount) > 0) {
        return {
          serialNumber: serialNumber,
          price: Math.abs(payment.amount) / 100000000, // Convert tinybars to HBAR
          buyer: nftReceiver,
          seller: nftSender
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error detecting sale:', error);
      return null;
    }
  }

  async sendSaleNotification(saleData) {
    try {
      const channel = this.client.channels.cache.get(this.salesChannelId);
      if (!channel) {
        console.error(`❌ Sales channel ${this.salesChannelId} not found`);
        return;
      }

      const { sales, timestamp, transactionId } = saleData;

      // Create HashScan link
      const hashScanLink = `https://hashscan.io/mainnet/transaction/${transactionId}`;

      // Get all serial numbers and calculate total price
      const serialNumbers = sales.map(sale => sale.serialNumber).sort((a, b) => a - b);
      const totalPrice = sales.reduce((sum, sale) => sum + sale.price, 0);
      const buyer = sales[0].buyer; // All sales in same transaction have same buyer
      const quantity = sales.length;

      // Format serial numbers display
      const serialsDisplay = serialNumbers.map(serial => `#${serial}`).join(', ');

      // Create embedded message
      const embed = new EmbedBuilder()
        .setTitle('🎉 SLIME SALE! 🎉')
        .setColor('#00ff40')
        .addFields(
          {
            name: '🎯 NFTs Sold',
            value: `**${serialsDisplay}** (${quantity} NFT${quantity > 1 ? 's' : ''})`,
            inline: false
          },
          {
            name: '💰 Total Price',
            value: `**${totalPrice} HBAR**`,
            inline: true
          },
          {
            name: '👤 Buyer',
            value: `\`${buyer}\``,
            inline: true
          },
          {
            name: '🔗 Transaction',
            value: `[View on HashScan](${hashScanLink})`,
            inline: false
          }
        )
        .setFooter({
          text: `Sale completed at ${timestamp.toLocaleString()}`
        })
        .setTimestamp(timestamp);

      await channel.send({ embeds: [embed] });
      console.log(`✅ Sale notification sent for ${quantity} NFT(s): ${serialsDisplay}`);

    } catch (error) {
      console.error('❌ Error sending sale notification:', error);
    }
  }

  // Manual trigger for testing
  async testSalesCheck() {
    console.log('🔧 Manual sales check triggered');
    await this.checkForNewSales();
  }
}

module.exports = HederaMirrorMonitor;
