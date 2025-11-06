"use client";

import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function SmartWalletBanner() {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [show, setShow] = useState(false);
  const [isSmartWallet, setIsSmartWallet] = useState(false);

  useEffect(() => {
    if (!account) {
      setShow(false);
      return;
    }

    // Check if it's a smart wallet
    let isSmart = false;
    try {
      if (wallet?.id === "smart") {
        isSmart = true;
      } else if (account) {
        // Check account type
        if (account.type === "smartAccount" || account.type === "erc4337") {
          isSmart = true;
        } else if ("sendBatchTransaction" in account) {
          isSmart = true;
        }
      }
    } catch (e) {
      console.error("Error checking wallet:", e);
    }

    setIsSmartWallet(isSmart);
    setShow(!isSmart);
  }, [account, wallet]);

  const handleCreateSmartWallet = () => {
    router.push("/setup-wallet");
  };

  if (!show || !account) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-40 px-4 animate-slide-down">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-cosmic-purple/90 to-cosmic-blue/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm">
                  Create Your Smart Wallet for Gasless Transactions
                </h3>
                <p className="text-white/80 text-xs mt-0.5">
                  Unlock zero gas fees and enjoy seamless transactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateSmartWallet}
                className="px-4 py-2 bg-white text-cosmic-purple rounded-lg font-semibold text-sm hover:bg-white/90 transition-all flex items-center gap-2"
              >
                Create Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShow(false)}
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

