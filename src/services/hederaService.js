const axios = require('axios');
const { TOKEN_ID, HEDERA_MIRROR_NODE_URL } = require('../utils/constants');

async function getNFTData(accountId) {
  try {
    const url = `${HEDERA_MIRROR_NODE_URL}/api/v1/accounts/${accountId}/nfts?token.id=${TOKEN_ID}`;
    console.log(`🌐 Hedera API URL: ${url}`);
    console.log(`🔗 Base URL: ${HEDERA_MIRROR_NODE_URL}`);
    console.log(`🎯 Token ID: ${TOKEN_ID}`);

    const response = await axios.get(url);
    const nfts = response.data.nfts || [];
    console.log(`📊 Raw API response:`, response.data);

    return {
      ownsToken: nfts.length > 0,
      quantity: nfts.length,
      serials: nfts.map(nft => nft.serial_number)
    };
  } catch (error) {
    console.error('❌ Hedera API error:', error.message);
    console.error('❌ Full error:', error);
    return { ownsToken: false, quantity: 0, serials: [] };
  }
}

module.exports = { getNFTData };
