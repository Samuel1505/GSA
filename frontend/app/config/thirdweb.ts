'use client'

/**
 * Thirdweb Smart Wallet Configuration
 * Simple, reliable, gasless transactions
 * https://portal.thirdweb.com/connect/account-abstraction
 */

import { createThirdwebClient } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { smartWallet } from "thirdweb/wallets";

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

/**
 * Smart Wallet Configuration
 * 
 * Features:
 * - Automatic smart account creation
 * - Gas sponsorship by Thirdweb
 * - ERC-4337 account abstraction
 * - Zero ETH required for users
 */
export const smartWalletConfig = smartWallet({
  chain: baseSepolia,
  sponsorGas: true, // Enable automatic gas sponsorship
});

/**
 * Connect smart wallet from active account
 */
export async function connectSmartWallet(activeAccount: any) {
  console.log(' Connecting Thirdweb smart wallet...');
  console.log(' Active account:', activeAccount?.address);

  if (!activeAccount) {
    throw new Error('No active account provided');
  }

  // Create a compatible account object with required properties
  const compatibleAccount = {
    address: activeAccount.address,
    id: activeAccount.id || activeAccount.address, // Use address as id if id is missing
    ...activeAccount
  };

  console.log('🔧 Using compatible account:', compatibleAccount);

  try {
    const wallet = await smartWalletConfig.connect({
      client,
      personalAccount: compatibleAccount,
    });

    // Get address from the wallet object
    const address = wallet.address;
    console.log(' Smart wallet connected:', address);

    return wallet;
  } catch (error) {
    console.error(' Failed to connect smart wallet:', error);
    throw error;
  }
}

// Contract address
export const CONTRACT_ADDRESS = "0xbc371b61052B4811424643cA41E9A4aFC94dc58e";

