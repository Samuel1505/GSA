/**
 * Utility to store and retrieve the mapping between EOA and Smart Wallet addresses
 * This ensures we don't create the smart wallet twice for the same EOA
 */

export interface SmartWalletMapping {
  eoaAddress: string; // User's EOA (MetaMask, etc.)
  smartWalletAddress: string; // Smart wallet address
  createdAt: string; // ISO timestamp
}

const STORAGE_KEY_PREFIX = "smart_wallet_mapping_";

/**
 * Store the mapping between EOA and Smart Wallet
 */
export function saveSmartWalletMapping(
  eoaAddress: string,
  smartWalletAddress: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  const key = `${STORAGE_KEY_PREFIX}${eoaAddress.toLowerCase()}`;
  const mapping: SmartWalletMapping = {
    eoaAddress: eoaAddress.toLowerCase(),
    smartWalletAddress: smartWalletAddress.toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(key, JSON.stringify(mapping));
  console.log("💾 Saved smart wallet mapping:", mapping);
}

/**
 * Get the smart wallet address for a given EOA
 */
export function getSmartWalletAddress(
  eoaAddress: string
): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = `${STORAGE_KEY_PREFIX}${eoaAddress.toLowerCase()}`;
  const data = window.localStorage.getItem(key);
  if (!data) return null;

  try {
    const mapping: SmartWalletMapping = JSON.parse(data);
    return mapping.smartWalletAddress;
  } catch (error) {
    console.error("Error parsing smart wallet mapping:", error);
    return null;
  }
}

/**
 * Get the full mapping object
 */
export function getSmartWalletMapping(
  eoaAddress: string
): SmartWalletMapping | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = `${STORAGE_KEY_PREFIX}${eoaAddress.toLowerCase()}`;
  const data = window.localStorage.getItem(key);
  if (!data) return null;

  try {
    return JSON.parse(data) as SmartWalletMapping;
  } catch (error) {
    console.error("Error parsing smart wallet mapping:", error);
    return null;
  }
}

/**
 * Check if an EOA has a smart wallet
 */
export function hasSmartWallet(eoaAddress: string): boolean {
  return findSmartWalletMapping(eoaAddress) !== null;
}

/**
 * Clear the mapping (useful for testing or reset)
 */
export function clearSmartWalletMapping(eoaAddress: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const key = `${STORAGE_KEY_PREFIX}${eoaAddress.toLowerCase()}`;
  window.localStorage.removeItem(key);
  console.log("🗑️ Cleared smart wallet mapping for:", eoaAddress);
}

/**
 * Find a smart wallet mapping by either EOA or smart wallet address
 */
export function findSmartWalletMapping(
  address: string
): SmartWalletMapping | null {
  if (typeof window === "undefined") {
    return null;
  }

  const lowerAddress = address.toLowerCase();

  // Try direct lookup treating the address as the EOA
  const directMapping = getSmartWalletMapping(lowerAddress);
  if (directMapping) {
    return directMapping;
  }

  // Fallback: search through stored mappings to find a matching smart wallet address
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) {
      continue;
    }

    try {
      const value = window.localStorage.getItem(key);
      if (!value) {
        continue;
      }

      const mapping = JSON.parse(value) as SmartWalletMapping;
      if (mapping.smartWalletAddress.toLowerCase() === lowerAddress) {
        return mapping;
      }
    } catch (error) {
      console.error("Error parsing smart wallet mapping entry:", error);
    }
  }

  return null;
}

