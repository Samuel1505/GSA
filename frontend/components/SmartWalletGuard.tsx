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

  // Setup page and homepage are accessible without smart wallet
  // ALL other pages require smart wallet
  const isSetupPage = pathname === "/setup-wallet";
  const isHomePage = pathname === "/";

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

      // On setup page or homepage, always allow access
      // Homepage allows browsing without smart wallet
      if (isSetupPage || pathname === "/") {
        setIsChecking(false);
        setHasChecked(true);
        return;
      }

      // Small delay to ensure wallet is fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      const isSmartWallet = checkIsSmartWallet();

      if (!isSmartWallet) {
        // User has regular wallet but no smart wallet
        // Block protected pages (Create, Markets, Dashboard, etc.) and redirect to setup
        // But allow homepage and setup page
        console.log("[SmartWalletGuard] Redirecting to setup - smart wallet required for protected pages");
        router.push("/setup-wallet");
      } else {
        setIsChecking(false);
        setHasChecked(true);
      }
    };

    checkSmartWallet();
  }, [account, wallet, pathname, router, isSetupPage]);

  // Show loading state while checking (but not on homepage or setup page)
  if (isChecking && account && !isSetupPage && pathname !== "/") {
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

