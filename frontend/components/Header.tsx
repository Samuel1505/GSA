"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { client } from "@/app/config/thirdweb";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  // Check if user has smart wallet
  const hasSmartWallet = () => {
    if (!wallet || !account) return false;
    try {
      // Check wallet ID
      if (wallet.id === "smart") return true;
      
      // Check account type
      if (account.type === "smartAccount" || account.type === "erc4337") {
        return true;
      }
      
      // Check if account has smart wallet methods
      if ("sendBatchTransaction" in account) {
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  };

  const isSmartWallet = hasSmartWallet();
  const isSetupPage = pathname === "/setup-wallet";

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If on setup page, allow navigation
    if (isSetupPage) return;
    
    // If no smart wallet, prevent navigation and redirect to setup
    if (!isSmartWallet && account) {
      e.preventDefault();
      router.push("/setup-wallet");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href={isSmartWallet || !account ? "/" : "/setup-wallet"}
            onClick={(e) => !isSmartWallet && account && handleNavigation(e, "/")}
          >
            <div className="text-2xl font-bold text-white cursor-pointer">
              <span className="text-cosmic-blue">S</span>
              <span className="text-cosmic-purple">t</span>
              <span className="text-cosmic-blue">r</span>
              <span className="text-cosmic-purple">e</span>
               <span className="text-cosmic-purple">a</span>
                <span className="text-cosmic-purple">k</span>
                 <span className="text-cosmic-purple">B</span>
                  <span className="text-cosmic-purple">e</span>
                   <span className="text-cosmic-purple">t</span>
            </div>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link 
            href="/create" 
            onClick={(e) => handleNavigation(e, "/create")}
            className={`transition-colors ${
              !isSmartWallet && account 
                ? "text-text-muted cursor-not-allowed opacity-50" 
                : "text-white hover:text-cosmic-blue"
            }`}
          >
            Create
          </Link>
          <Link 
            href="/markets" 
            onClick={(e) => handleNavigation(e, "/markets")}
            className={`transition-colors ${
              !isSmartWallet && account 
                ? "text-text-muted cursor-not-allowed opacity-50" 
                : "text-white hover:text-cosmic-blue"
            }`}
          >
            Markets
          </Link>
          <Link 
            href="/dashboard" 
            onClick={(e) => handleNavigation(e, "/dashboard")}
            className={`transition-colors ${
              !isSmartWallet && account 
                ? "text-text-muted cursor-not-allowed opacity-50" 
                : "text-white hover:text-cosmic-blue"
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/leaderboard" 
            onClick={(e) => handleNavigation(e, "/leaderboard")}
            className={`transition-colors ${
              !isSmartWallet && account 
                ? "text-text-muted cursor-not-allowed opacity-50" 
                : "text-white hover:text-cosmic-blue"
            }`}
          >
            Leaderboard
          </Link>
          <Link 
            href="/wallet" 
            className="text-white hover:text-cosmic-blue transition-colors"
          >
            Wallet
          </Link>
        </div>
        
        <ConnectButton
          client={client}
          // No wallets array - Thirdweb will auto-detect browser wallets (MetaMask, Coinbase, etc.)
          // Users connect with regular wallet first, then use setup page to create smart wallet
          connectButton={{
            label: "Connect Wallet",
            className: "bg-cosmic-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-cosmic-blue/50"
          }}
          connectModal={{
            size: "wide",
            welcomeScreen: {
              title: "Connect to StreakBet",
              subtitle: "Connect your wallet to start making predictions",
            },
          }}
        />
      </nav>
    </header>
  );
}