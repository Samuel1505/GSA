require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  RPC_URL: process.env.RPC_URL,
  RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY,
  FORWARDER_ADDRESS: process.env.FORWARDER_ADDRESS,
};
