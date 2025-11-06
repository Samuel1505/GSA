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

  // Pages that don't require smart wallet
  const publicPages = ["/", "/markets", "/setup-wallet"];
  const isPublicPage = publicPages.includes(pathname) || pathname.startsWith("/markets/");

  useEffect(() => {
    const checkSmartWallet = async () => {
      // If no account, don't redirect
      if (!account) {
        setIsChecking(false);
        return;
      }

      // If on public page, don't check
      if (isPublicPage) {
        setIsChecking(false);
        return;
      }

      // Check if wallet is a smart wallet
      // Smart wallets typically have id "smart" or connection status indicates smart account
      let isSmartWallet = false;
      
      try {
        const account = wallet?.getAccount?.();
        isSmartWallet = 
          wallet?.id === "smart" || 
          account?.type === "smartAccount" ||
          account?.type === "erc4337" ||
          (account && "sendBatchTransaction" in account); // Smart accounts have batch transaction support
      } catch (e) {
        // If we can't check, assume it's not a smart wallet
        isSmartWallet = false;
      }

      if (!isSmartWallet) {
        // User has regular wallet but no smart wallet, redirect to setup
        router.push("/setup-wallet");
      } else {
        setIsChecking(false);
      }
    };

    checkSmartWallet();
  }, [account, wallet, pathname, router, isPublicPage]);

  // Show loading state while checking
  if (isChecking && account && !isPublicPage) {
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

