"use client";

import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { getSmartWalletAddress } from "@/app/utils/smartWalletStorage";
import { useState, useEffect } from "react";

/**
 * Hook to get the smart wallet address to display in the app
 * Returns the smart wallet address if available, otherwise falls back to EOA
 */
export function useSmartWalletAddress(): string | null {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [displayAddress, setDisplayAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!account) {
      setDisplayAddress(null);
      return;
    }

    // If already a smart wallet, use its address
    if (wallet && wallet.id === "smart") {
      setDisplayAddress(account.address);
      return;
    }

    // If regular wallet, check if we have a stored smart wallet mapping
    const smartWalletAddr = getSmartWalletAddress(account.address);
    if (smartWalletAddr) {
      setDisplayAddress(smartWalletAddr);
      return;
    }

    // Fallback to EOA address
    setDisplayAddress(account.address);
  }, [account, wallet]);

  return displayAddress;
}

