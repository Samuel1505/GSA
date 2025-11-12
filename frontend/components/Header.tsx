"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ConnectButton, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { client, chain } from "@/app/config/thirdweb";
import { findSmartWalletMapping, getSmartWalletAddress } from "@/app/utils/smartWalletStorage";
import { toast } from "react-toastify";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  // Check if user has smart wallet (active or stored)
  const hasSmartWallet = () => {
    if (!account) return false;
    
    try {
      // Check if wallet is active smart wallet in React context
      if (wallet && wallet.id === "smart") return true;
      
      // Check if account has smart wallet methods
      if (wallet && account && "sendBatchTransaction" in account) {
        return true;
      }
      
      // Check if user has a stored smart wallet address in localStorage
      const storedMapping = findSmartWalletMapping(account.address);
      if (storedMapping) {
        return true;
      }
      const legacyStored = getSmartWalletAddress(account.address);
      if (legacyStored) {
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
    // If on setup page or homepage, allow navigation to homepage
    if (isSetupPage || href === "/") return;
    
    // If no smart wallet, prevent navigation to protected pages and show toast
    // Allow browsing homepage without smart wallet
    if (!isSmartWallet && account) {
      e.preventDefault();
      
      // Show toast notification
      toast.warning(
        <div>
          <div className="font-semibold mb-1">Smart Wallet Required</div>
          <div className="text-sm opacity-90">
            Please create your smart wallet to access this page and enjoy gasless transactions.
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            background: "rgba(10, 10, 10, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            color: "#ffffff",
            backdropFilter: "blur(10px)",
          },
        }
      );
      
      // Also redirect to setup page after a short delay
      setTimeout(() => {
        router.push("/setup-wallet");
      }, 500);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/"
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
            className="text-white hover:text-cosmic-blue transition-colors"
          >
            Create
          </Link>
          <Link 
            href="/markets" 
            onClick={(e) => handleNavigation(e, "/markets")}
            className="text-white hover:text-cosmic-blue transition-colors"
          >
            Markets
          </Link>
          <Link 
            href="/dashboard" 
            onClick={(e) => handleNavigation(e, "/dashboard")}
            className="text-white hover:text-cosmic-blue transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/leaderboard" 
            onClick={(e) => handleNavigation(e, "/leaderboard")}
            className="text-white hover:text-cosmic-blue transition-colors"
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
          accountAbstraction={{
            chain,
            sponsorGas: true,
          }}
          
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