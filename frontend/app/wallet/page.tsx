"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { getSmartWalletAddress } from "@/app/utils/smartWalletStorage";
import Header from "@/components/Header";
import { Wallet, Copy, ExternalLink, RefreshCw, CheckCircle2, ArrowLeft } from "lucide-react";

export default function WalletPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
  const [eoaAddress, setEoaAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if user has smart wallet
  useEffect(() => {
    if (!account) {
      router.push("/setup-wallet");
      return;
    }

    const isSmartWallet = wallet && wallet.id === "smart";
    
    if (isSmartWallet) {
      // Connected as smart wallet - use account.address as smart wallet address
      setSmartWalletAddress(account.address);
      
      // Find EOA from localStorage
      const storedSmartWallet = getSmartWalletAddress(account.address);
      if (!storedSmartWallet) {
        // If not found, search reverse mapping
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("smart_wallet_mapping_")) {
            try {
              const mapping = JSON.parse(localStorage.getItem(key) || "{}");
              if (mapping.smartWalletAddress?.toLowerCase() === account.address.toLowerCase()) {
                setEoaAddress(mapping.eoaAddress);
                break;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } else {
      // Regular wallet - check if smart wallet exists
      const storedSmartWallet = getSmartWalletAddress(account.address);
      if (storedSmartWallet) {
        setSmartWalletAddress(storedSmartWallet);
        setEoaAddress(account.address);
      } else {
        // No smart wallet - redirect to setup
        router.push("/setup-wallet");
      }
    }
  }, [account, wallet, router]);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!smartWalletAddress) return;
      
      setIsLoadingBalance(true);
      try {
        const response = await fetch("https://sepolia.base.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [smartWalletAddress, "latest"],
          }),
        });
        const data = await response.json();
        const balanceWei = BigInt(data.result || "0x0");
        const balanceEth = Number(balanceWei) / 1e18;
        setBalance(balanceEth.toFixed(6));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("0.000000");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    if (smartWalletAddress) {
      fetchBalance();
    }
  }, [smartWalletAddress]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-cosmic-dark relative overflow-hidden">
        <div className="absolute inset-0 cosmic-gradient" />
        <Header />
        <main className="relative z-10 pt-32 pb-20 px-6 flex items-center justify-center min-h-screen">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Wallet className="w-16 h-16 text-cosmic-purple mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
              <p className="text-text-muted mb-6">Please connect your wallet to view your smart wallet details.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!smartWalletAddress) {
    return (
      <div className="min-h-screen bg-cosmic-dark relative overflow-hidden">
        <div className="absolute inset-0 cosmic-gradient" />
        <Header />
        <main className="relative z-10 pt-32 pb-20 px-6 flex items-center justify-center min-h-screen">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Wallet className="w-16 h-16 text-cosmic-purple mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-4">No Smart Wallet Found</h1>
              <p className="text-text-muted mb-6">Create your smart wallet to get started.</p>
              <button
                onClick={() => router.push("/setup-wallet")}
                className="px-6 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-lg text-white font-semibold hover:shadow-lg transition-all"
              >
                Create Smart Wallet
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isSmartWalletActive = wallet && wallet.id === "smart";

  return (
    <div className="min-h-screen bg-cosmic-dark relative overflow-hidden">
      <div className="absolute inset-0 cosmic-gradient" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cosmic-purple/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cosmic-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push("/")}
            className="mb-6 flex items-center gap-2 text-text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-glow">
              Smart Wallet Details
            </h1>
            <p className="text-text-muted text-lg">
              Your gasless transaction wallet powered by Account Abstraction
            </p>
          </div>

          {/* Status Badge */}
          <div className="mb-8 flex justify-center">
            <div className={`px-6 py-3 rounded-full font-semibold ${
              isSmartWalletActive
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
            }`}>
              {isSmartWalletActive ? "✓ Active" : "⚠️ Not Connected"}
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
            {/* Smart Wallet Address */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Smart Wallet Address
                </h2>
                <button
                  onClick={() => copyToClipboard(smartWalletAddress)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all flex items-center gap-2 text-sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white font-mono text-sm break-all">
                  {smartWalletAddress}
                </p>
              </div>
              <div className="mt-3 flex gap-3">
                <a
                  href={`https://basescan.org/address/${smartWalletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-all"
                >
                  View on BaseScan
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  Balance
                </h2>
                <button
                  onClick={() => {
                    setIsLoadingBalance(true);
                    setTimeout(() => {
                      const fetchBalance = async () => {
                        try {
                          const response = await fetch("https://sepolia.base.org", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              jsonrpc: "2.0",
                              id: 1,
                              method: "eth_getBalance",
                              params: [smartWalletAddress, "latest"],
                            }),
                          });
                          const data = await response.json();
                          const balanceWei = BigInt(data.result || "0x0");
                          const balanceEth = Number(balanceWei) / 1e18;
                          setBalance(balanceEth.toFixed(6));
                        } catch (error) {
                          console.error("Error fetching balance:", error);
                        } finally {
                          setIsLoadingBalance(false);
                        }
                      };
                      fetchBalance();
                    }, 100);
                  }}
                  disabled={isLoadingBalance}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isLoadingBalance ? "animate-spin" : ""}`} />
                </button>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                {isLoadingBalance ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-white">
                      {balance || "0.000000"}
                    </span>
                    <span className="text-xl text-text-muted">ETH</span>
                  </div>
                )}
              </div>
            </div>

            {/* EOA Controller */}
            {eoaAddress && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  EOA Controller
                </h2>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-white font-mono text-sm">
                    {eoaAddress}
                  </p>
                </div>
                <p className="text-text-muted text-xs mt-3">
                  Your MetaMask or wallet that controls this smart wallet
                </p>
              </div>
            )}

            {/* Network Info */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Network</h2>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 font-semibold">Base Sepolia Testnet</p>
                <p className="text-text-muted text-xs mt-1">Gas fees are sponsored - transactions are free!</p>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-4">💡 How It Works</h3>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Your EOA (MetaMask) signs all transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Smart wallet executes them on-chain (gasless)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>You stay in full control of your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>All gas fees are sponsored by Thirdweb</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          {!isSmartWalletActive && (
            <div className="text-center">
              <button
                onClick={() => router.push("/setup-wallet")}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-green-500/50 transition-all"
              >
                Activate Smart Wallet
              </button>
              <p className="text-text-muted text-sm mt-3">
                Connect your smart wallet to start making gasless transactions
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

