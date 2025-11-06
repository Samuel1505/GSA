"use client";

import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { ArrowRight, Wallet, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getSmartWalletAddress } from "@/app/utils/smartWalletStorage";

export default function SmartWalletPrompt() {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [showCreate, setShowCreate] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [hasSmartWallet, setHasSmartWallet] = useState(false);

  useEffect(() => {
    if (!account) {
      setShowCreate(false);
      setShowWallet(false);
      return;
    }

    // Check if it's a smart wallet
    let isSmart = false;
    try {
      if (wallet?.id === "smart") {
        isSmart = true;
      } else if (account && "sendBatchTransaction" in account) {
        isSmart = true;
      }
    } catch (e) {
      console.error("Error checking wallet:", e);
    }

    // Check if smart wallet exists (even if not connected)
    const storedSmartWallet = getSmartWalletAddress(account.address);
    const hasWallet = isSmart || !!storedSmartWallet;

    setHasSmartWallet(hasWallet);
    setShowCreate(!hasWallet);
    setShowWallet(hasWallet);
  }, [account, wallet]);

  const handleCreateSmartWallet = () => {
    router.push("/setup-wallet");
  };

  const handleViewWallet = () => {
    router.push("/wallet");
  };

  // Show create prompt if no smart wallet
  if (showCreate && account) {
    return (
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-glow">
            Create Your Smart Wallet
          </h2>
          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-8">
            Unlock gasless transactions and enjoy seamless trading with zero gas fees.
          </p>
          
          <button
            onClick={handleCreateSmartWallet}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-cosmic-blue/50 transition-all hover:scale-105"
          >
            Create Smart Wallet
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    );
  }

  // Show wallet access card if smart wallet exists
  if (showWallet && account) {
    return (
      <section className="relative py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-cosmic-purple to-cosmic-blue">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Smart Wallet Active
                  </h2>
                  <p className="text-text-muted">
                    Your gasless transaction wallet is ready to use
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleViewWallet}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-medium text-white transition-all hover:border-white/30"
              >
                <Wallet className="w-5 h-5" />
                View Wallet Details
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

