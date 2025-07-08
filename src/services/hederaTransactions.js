const {
  Client,
  AccountId,
  PrivateKey,
  Hbar,
  TokenId,
  TransferTransaction,
  TokenInfoQuery,
  AccountBalanceQuery
} = require('@hashgraph/sdk');

// Hedera setup - only initialize if environment variables are present
let operatorId, operatorKey, client, NFT_TOKEN_ID;

function initializeHedera() {
  if (!process.env.FAUCET_ACCOUNT_ID || !process.env.FAUCET_PRIVATE_KEY) {
    console.log('⚠️ Faucet environment variables not set - faucet features disabled');
    return false;
  }

  try {
    operatorId = AccountId.fromString(process.env.FAUCET_ACCOUNT_ID);

    // Try ECDSA first, then ED25519 as fallback
    try {
      operatorKey = PrivateKey.fromStringECDSA(process.env.FAUCET_PRIVATE_KEY);
      console.log('🔑 Using ECDSA private key');
    } catch (ecdsaError) {
      operatorKey = PrivateKey.fromStringED25519(process.env.FAUCET_PRIVATE_KEY);
      console.log('🔑 Using ED25519 private key');
    }

    const { TOKEN_ID } = require('../utils/constants');
    NFT_TOKEN_ID = TokenId.fromString(TOKEN_ID);
    client = Client.forMainnet().setOperator(operatorId, operatorKey);

    console.log(`✅ Hedera faucet initialized with account: ${process.env.FAUCET_ACCOUNT_ID}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Hedera faucet:', error.message);
    return false;
  }
}

// Initialize on module load
const isHederaInitialized = initializeHedera();

// Helper function for retrying Hedera operations with exponential backoff
async function retryHederaOperation(operation, maxAttempts = 5) {
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      attempt++;
      return await operation();
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt === maxAttempts) {
        throw new Error(`Max attempts (${maxAttempts}) reached: ${error.message}`);
      }

      // Exponential backoff: 1s, 2s, 4s, 8s
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Check if wallet is associated with token
async function checkAssociation(walletId) {
  if (!isHederaInitialized) {
    return '❌ Faucet service not configured. Please contact administrator.';
  }

  try {
    const result = await retryHederaOperation(() =>
      new AccountBalanceQuery().setAccountId(walletId).execute(client)
    );
    const associated = result.tokens._map.has(NFT_TOKEN_ID.toString());

    return associated
      ? `✅ Wallet \`${walletId}\` **is associated** with SLIME NFTs.`
      : `❌ Wallet \`${walletId}\` **is NOT associated** with SLIME NFTs.`;

  } catch (err) {
    console.error('❌ Association check error:', err);
    return `❌ Error checking association for wallet \`${walletId}\`: ${err.message}`;
  }
}

// Get wallet balance
async function getBalance(walletId) {
  if (!isHederaInitialized) {
    return '❌ Faucet service not configured. Please contact administrator.';
  }

  try {
    const result = await retryHederaOperation(() =>
      new AccountBalanceQuery().setAccountId(walletId).execute(client)
    );

    const hbarBalance = result.hbars.toBigNumber().toFixed(2);
    const nftBalance = result.tokens.get(NFT_TOKEN_ID.toString());
    const nftAmount = nftBalance ? nftBalance.toBigNumber().toString() : '0';

    return `💰 **Wallet Balance for \`${walletId}\`:**\n🔹 **HBAR:** ${hbarBalance}\n🎯 **SLIME NFTs:** ${nftAmount}`;

  } catch (err) {
    console.error('❌ Balance check error:', err);
    return `❌ Error checking balance for wallet \`${walletId}\`: ${err.message}`;
  }
}

// Get random NFT serial from faucet wallet
async function getRandomNFTSerial() {
  if (!isHederaInitialized) {
    throw new Error('Faucet service not configured');
  }

  try {
    // Query the faucet wallet's NFTs
    const axios = require('axios');
    const { HEDERA_MIRROR_NODE_URL } = require('../utils/constants');

    const response = await axios.get(
      `${HEDERA_MIRROR_NODE_URL}/api/v1/accounts/${operatorId}/nfts?token.id=${NFT_TOKEN_ID}`
    );

    const nfts = response.data.nfts || [];
    if (nfts.length === 0) {
      throw new Error('No NFTs available in faucet wallet');
    }

    // Pick random NFT
    const randomIndex = Math.floor(Math.random() * nfts.length);
    return nfts[randomIndex].serial_number;

  } catch (error) {
    console.error('❌ Error getting random NFT serial:', error);
    throw error;
  }
}

// Transfer NFT to winner
async function transferNFT(winnerWalletId, serialNumber = null) {
  if (!isHederaInitialized) {
    return {
      success: false,
      error: 'Faucet service not configured',
      message: '❌ Faucet service not configured. Please contact administrator.'
    };
  }

  try {
    const walletStr = String(winnerWalletId);

    if (!walletStr.startsWith('0.0.')) {
      throw new Error('Invalid wallet format. Expected 0.0.xxxx');
    }

    // If no serial specified, get a random one
    if (!serialNumber) {
      serialNumber = await getRandomNFTSerial();
    }

    console.log(`🎁 Transferring SLIME NFT serial #${serialNumber} to ${walletStr}`);

    const tx = await new TransferTransaction()
      .addNftTransfer(NFT_TOKEN_ID, serialNumber, operatorId, AccountId.fromString(walletStr))
      .freezeWith(client)
      .sign(operatorKey);

    const result = await retryHederaOperation(() => tx.execute(client));

    console.log(`✅ NFT transfer successful! Transaction ID: ${result.transactionId}`);
    return {
      success: true,
      serialNumber: serialNumber,
      transactionId: result.transactionId.toString(),
      message: `✅ Successfully sent SLIME NFT #${serialNumber} to ${walletStr}`
    };

  } catch (err) {
    console.error('❌ NFT transfer failed:', err);
    return {
      success: false,
      error: err.message,
      message: `❌ NFT transfer failed: ${err.message}`
    };
  }
}

// Get available NFTs in faucet wallet
async function getAvailableNFTs() {
  if (!isHederaInitialized) {
    return {
      count: 0,
      hasNFTs: false,
      error: 'Faucet service not configured'
    };
  }

  try {
    // Use Mirror Node API to get NFT count (more reliable)
    const axios = require('axios');
    const { HEDERA_MIRROR_NODE_URL } = require('../utils/constants');

    const response = await axios.get(
      `${HEDERA_MIRROR_NODE_URL}/api/v1/accounts/${operatorId}/nfts?token.id=${NFT_TOKEN_ID}`
    );

    const nfts = response.data.nfts || [];
    const nftCount = nfts.length;

    console.log(`🎯 Faucet wallet ${operatorId} has ${nftCount} SLIME NFTs available`);

    return {
      count: nftCount,
      hasNFTs: nftCount > 0
    };

  } catch (err) {
    console.error('❌ Error checking available NFTs:', err);
    return {
      count: 0,
      hasNFTs: false,
      error: err.message
    };
  }
}

module.exports = {
  checkAssociation,
  getBalance,
  transferNFT,
  getAvailableNFTs,
  retryHederaOperation,
  isHederaInitialized,
  get operatorId() { return operatorId; },
  get operatorKey() { return operatorKey; },
  get NFT_TOKEN_ID() { return NFT_TOKEN_ID; },
  get client() { return client; }
};
