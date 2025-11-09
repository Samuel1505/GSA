"use client";

import { client, smartWalletConfig } from "@/app/config/thirdweb";
import { findSmartWalletMapping } from "./smartWalletStorage";

interface EnsureSmartWalletOptions {
  account: any | null;
  wallet: any | null;
  connect: (walletFactory: () => Promise<any>) => Promise<any>;
  onStatus?: (message: string) => void;
}

interface EnsureSmartWalletResult {
  smartAccount: any | null;
  isSmartWallet: boolean;
  error?: Error | null;
}

/**
 * Ensure the user has an active smart wallet account available for transactions.
 * - Returns an existing smart wallet account if already active
 * - Attempts to reconnect to a stored smart wallet if found in localStorage
 */
export async function ensureSmartWalletAccount({
  account,
  wallet,
  connect,
  onStatus,
}: EnsureSmartWalletOptions): Promise<EnsureSmartWalletResult> {
  if (!account) {
    return { smartAccount: null, isSmartWallet: false };
  }

  try {
    console.log("[ensureSmartWalletAccount] Active account:", account.address);

    // Already connected as smart wallet
    if (wallet?.id === "smart") {
      console.log("[ensureSmartWalletAccount] Wallet already active as smart");
      return { smartAccount: account, isSmartWallet: true };
    }

    // Account already exposes smart wallet methods
    if (typeof (account as any)?.sendBatchTransaction === "function") {
      console.log("[ensureSmartWalletAccount] Account already has batch transaction capability");
      return { smartAccount: account, isSmartWallet: true };
    }

    const mapping = account.address ? findSmartWalletMapping(account.address) : null;
    console.log("[ensureSmartWalletAccount] Stored mapping lookup:", mapping);
    if (!mapping) {
      return { smartAccount: null, isSmartWallet: false };
    }

    // Attempt to reconnect smart wallet using stored mapping
    onStatus?.("Reactivating your smart wallet...");

    const smartAccount = await smartWalletConfig.connect({
      client,
      personalAccount: account,
    });

    console.log("[ensureSmartWalletAccount] Connected smart account address:", smartAccount.address);

    try {
      await connect(async () => smartWalletConfig);
    } catch (connectError: any) {
      console.warn(
        "Could not set smart wallet as active in context:",
        connectError?.message || connectError
      );
    }

    const hasBatchTransaction =
      typeof (smartAccount as any)?.sendBatchTransaction === "function";

    if (!hasBatchTransaction) {
      console.warn(
        "[ensureSmartWalletAccount] Smart account retrieved but does not expose sendBatchTransaction"
      );
    }

    onStatus?.("");
    return {
      smartAccount,
      isSmartWallet: hasBatchTransaction,
    };
  } catch (error) {
    console.error("ensureSmartWalletAccount error:", error);
    onStatus?.("");
    return {
      smartAccount: null,
      isSmartWallet: false,
      error: error as Error,
    };
  }
}

