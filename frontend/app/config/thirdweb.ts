'use client'

import { createThirdwebClient } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { smartWallet } from "thirdweb/wallets";
import { inAppWallet } from "thirdweb/wallets";

// Get Thirdweb Client ID from environment variable
export const thirdwebClientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!thirdwebClientId) {
  console.warn('NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set. Please add it to your .env.local file.');
}

// Create Thirdweb client
export const client = createThirdwebClient({
  clientId: thirdwebClientId || "YOUR_CLIENT_ID_HERE", // Fallback for development
});

// Chain configuration
export const chain = baseSepolia;

// Smart wallet configuration with sponsored gas
export const smartWalletConfig = smartWallet({
  chain: baseSepolia,
  sponsorGas: true, // Thirdweb sponsors gas fees!
});

// In-app wallet configuration (for email/social login) with smart account
export const inAppWalletConfig = inAppWallet({
  smartAccount: {
    chain: baseSepolia,
    sponsorGas: true, // Enable sponsored transactions
  },
});

// Contract address
export const CONTRACT_ADDRESS = "0xbc371b61052B4811424643cA41E9A4aFC94dc58e";

