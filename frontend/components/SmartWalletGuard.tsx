"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";

interface SmartWalletGuardProps {
  children: React.ReactNode;
}

export default function SmartWalletGuard({ children }: SmartWalletGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  // Only setup-wallet page is accessible without smart wallet
  // ALL other pages require smart wallet
  const isSetupPage = pathname === "/setup-wallet";

  // Helper function to check if wallet is smart wallet
  const checkIsSmartWallet = (): boolean => {
    if (!wallet || !account) {
      return false;
    }

    try {
      // Check wallet ID - this is the most reliable indicator
      // Smart wallets in Thirdweb have id === "smart"
      if (wallet.id === "smart") {
        return true;
      }
      
      // Check account type if available
      // Smart accounts have type === "smartAccount" or type === "erc4337"
      if (account.type === "smartAccount" || account.type === "erc4337") {
        return true;
      }
      
      // Check if account has smart wallet methods
      if ("sendBatchTransaction" in account) {
        return true;
      }
      
      return false;
    } catch (e) {
      console.error("[SmartWalletGuard] Error checking smart wallet:", e);
      return false;
    }
  };

  useEffect(() => {
    const checkSmartWallet = async () => {
      // If no account, allow access (user can browse but not transact)
      if (!account) {
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // On setup page, always allow access
      if (isSetupPage) {
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Small delay to ensure wallet is fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      const isSmartWallet = checkIsSmartWallet();

      if (!isSmartWallet) {
        // User has regular wallet but no smart wallet
        // Block ALL pages and redirect to setup - users MUST create smart wallet first
        console.log("[SmartWalletGuard] Redirecting to setup - smart wallet required for all pages");
        router.push("/setup-wallet");
      } else {
        setIsChecking(false);
        setHasChecked(true);
      }
    };

    checkSmartWallet();
  }, [account, wallet, pathname, router, isSetupPage]);

  // Show loading state while checking
  if (isChecking && account && !isSetupPage) {
    return (
      <div className="min-h-screen bg-cosmic-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cosmic-purple mb-4"></div>
          <p className="text-text-muted">Checking wallet setup...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

