"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWallet, useConnect } from "thirdweb/react";
import { connectSmartWallet, smartWalletConfig, client } from "@/app/config/thirdweb";
import { saveSmartWalletMapping, getSmartWalletAddress } from "@/app/utils/smartWalletStorage";
import Header from "@/components/Header";
import { Wallet, Sparkles, CheckCircle2, ArrowRight, Loader2, ExternalLink } from "lucide-react";

export default function SetupWalletPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect } = useConnect();
  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState("");
  const [existingSmartWalletAddr, setExistingSmartWalletAddr] = useState<string | null>(null);
  const [isConnectingToExisting, setIsConnectingToExisting] = useState(false);
  const [smartWalletBalance, setSmartWalletBalance] = useState<string | null>(null);
  const [isSmartWalletActive, setIsSmartWalletActive] = useState(false);

  // Store EOA address when account first connects (before smart wallet)
  const [eoaAddress, setEoaAddress] = useState<string | null>(null);
  

  useEffect(() => {
    if (account && !eoaAddress && wallet && wallet.id !== "smart") {
      // Store the EOA address when we first see a regular wallet
      setEoaAddress(account.address);
      console.log("💾 Stored EOA address:", account.address);
    }
  }, [account, wallet, eoaAddress]);

  // Fetch smart wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      // If connected as smart wallet, use account.address, otherwise use stored address
      const smartWalletAddr = (wallet && wallet.id === "smart" && account) 
        ? account.address 
        : existingSmartWalletAddr;
      
      if (!smartWalletAddr) return;
      
      try {
        const response = await fetch("https://sepolia.base.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [smartWalletAddr, "latest"],
          }),
        });
        const data = await response.json();
        const balanceWei = BigInt(data.result || "0x0");
        const balanceEth = Number(balanceWei) / 1e18;
        setSmartWalletBalance(balanceEth.toFixed(6));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    if (wallet && wallet.id === "smart" && account) {
      // Fetch balance immediately when smart wallet is connected
      fetchBalance();
    } else if (existingSmartWalletAddr) {
      fetchBalance();
    }
  }, [existingSmartWalletAddr, wallet, account]);

  // Check if user already has a smart wallet (either connected or stored)
  useEffect(() => {
    if (!account) return;

    // Check if already connected as smart wallet
    const isSmartWallet = wallet && wallet.id === "smart";
    
    if (isSmartWallet) {
      // User has smart wallet active - redirect to wallet details page
      router.push("/wallet");
      return;
    }

    // If we have a stored smart wallet but not connected, show it and let user connect
    const storedSmartWallet = getSmartWalletAddress(account.address);
    if (storedSmartWallet && !isSmartWallet) {
      console.log("📋 Found stored smart wallet for EOA:", storedSmartWallet);
      setExistingSmartWalletAddr(storedSmartWallet);
      // Don't auto-connect, let user click button
    }
  }, [account, wallet, router, eoaAddress]);

  const handleShowInstructions = () => {
    setShowInstructions(true);
    setError("");
  };

  const handleConnectToExistingSmartWallet = useCallback(async (smartWalletAddr: string) => {
    if (!account || isConnectingToExisting) return;

    try {
      setIsConnectingToExisting(true);
      setCreationStep("Connecting to your existing smart wallet...");
      setError("");
      
      console.log("🔄 Activating smart wallet...");
      
      // Use useConnect to connect the smart wallet through React context
      // Pass the smartWalletConfig directly as the connector
      const connectedWallet = await connect(smartWalletConfig, {
        personalAccount: account,
      });
      
      console.log("✅ Connected wallet:", connectedWallet);
      console.log("✅ Wallet ID:", connectedWallet?.id);
      console.log("✅ Wallet address:", connectedWallet?.address);
      
      const connectedSmartWalletAddr = connectedWallet?.address || smartWalletAddr;
      
      console.log("🔍 Connected wallet ID check:", connectedWallet?.id);
      
      // Save the mapping
      saveSmartWalletMapping(account.address, connectedSmartWalletAddr);
      setExistingSmartWalletAddr(connectedSmartWalletAddr);
      
      // If the connected wallet is a smart wallet, mark as active immediately
      if (connectedWallet?.id === "smart") {
        console.log("✅ Smart wallet connected successfully!");
        setIsSmartWalletActive(true);
        // Redirect to wallet details page after successful activation
        setTimeout(() => {
          router.push("/wallet");
        }, 1500);
      }
      
      // Wait for React state to update - give it more time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force a re-check by logging current wallet state
      console.log("🔍 Current wallet state after connect:", {
        walletId: wallet?.id,
        accountAddress: account?.address,
        isSmartWalletActive,
      });
      
      // The useEffect will detect wallet.id === "smart" and redirect
      setIsConnectingToExisting(false);
    } catch (err: any) {
      console.error("❌ Error connecting to existing smart wallet:", err);
      setIsConnectingToExisting(false);
      setError(err.message || "Failed to connect to existing smart wallet. Please try again.");
    }
  }, [account, isConnectingToExisting, connect, wallet]);

  const handleCreateSmartWallet = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    // Check if smart wallet already exists for this EOA
    const existingSmartWallet = getSmartWalletAddress(account.address);
    if (existingSmartWallet) {
      console.log("✅ Smart wallet already exists for this EOA, connecting...");
      setExistingSmartWalletAddr(existingSmartWallet);
      await handleConnectToExistingSmartWallet(existingSmartWallet);
      return;
    }

    try {
      setIsCreating(true);
      setError("");
      setCreationStep("Creating your smart wallet...");

      console.log("🔄 Creating smart wallet for EOA:", account.address);

      // Use connect() with a function that returns the wallet connector
      const connectedWallet = await connect(async () => {
        // Connect and return the smart wallet
        return await smartWalletConfig.connect({
          client,
          personalAccount: account,
        });
      });
      
      // Get the smart wallet address directly from wallet
      // Don't call getAccount() as it may not exist on smart wallets
      const smartWalletAddress = connectedWallet.address || 
                                   (connectedWallet as any).getAddress?.() ||
                                   account.address; // Fallback

      console.log("✅ Smart wallet created:", smartWalletAddress);

      // Save the mapping: EOA -> Smart Wallet
      saveSmartWalletMapping(account.address, smartWalletAddress);
      setCreationStep("Smart wallet created successfully!");
      
      // Set as existing smart wallet to show details instead of redirecting
      setExistingSmartWalletAddr(smartWalletAddress);
      
      // Mark as active if it's a smart wallet
      if (connectedWallet?.id === "smart") {
        setIsSmartWalletActive(true);
        // Redirect to wallet details page after successful creation
        setTimeout(() => {
          router.push("/wallet");
        }, 1500);
      }
      
      // Wait a bit for wallet state to update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsCreating(false);

    } catch (err: any) {
      console.error("❌ Error creating smart wallet:", err);
      setError(err.message || "Failed to create smart wallet. Please try again.");
      setCreationStep("");
    } finally {
      setIsCreating(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-cosmic-dark relative overflow-hidden">
        <div className="absolute inset-0 cosmic-gradient" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cosmic-purple/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cosmic-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <Header />

        <main className="relative z-10 pt-32 pb-20 px-6 flex items-center justify-center min-h-screen">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Wallet className="w-16 h-16 text-cosmic-purple mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-4">
                Connect Your Wallet First
              </h1>
              <p className="text-text-muted mb-6">
                Please connect your wallet using the button in the header to continue.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          <div className="space-y-8">
              {/* Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-full mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-glow">
                  Create Your Smart Wallet
                </h1>
                <p className="text-text-muted text-lg max-w-2xl mx-auto">
                  Unlock gasless transactions and enjoy a seamless experience with your smart wallet powered by Account Abstraction
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="w-12 h-12 bg-cosmic-purple/20 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-cosmic-purple" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Gasless Transactions</h3>
                  <p className="text-text-muted text-sm">
                    All transactions are sponsored. You never pay gas fees!
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="w-12 h-12 bg-cosmic-blue/20 rounded-lg flex items-center justify-center mb-4">
                    <Wallet className="w-6 h-6 text-cosmic-blue" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">You Stay in Control</h3>
                  <p className="text-text-muted text-sm">
                    Your EOA (MetaMask/wallet) still controls the smart wallet. You sign, smart wallet executes.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Instant Setup</h3>
                  <p className="text-text-muted text-sm">
                    Create your smart wallet in seconds. No complex setup required.
                  </p>
                </div>
              </div>

              {/* Current Wallet Info - Only show if NOT connected as smart wallet */}
              {!((wallet && wallet.id === "smart") || isSmartWalletActive) && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-sm mb-1">Current Wallet</p>
                      <p className="text-white font-mono text-sm">
                        {account.address.slice(0, 6)}...{account.address.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-sm mb-1">Wallet Type</p>
                      <p className="text-white font-semibold">Regular Wallet</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show smart wallet details if connected as smart wallet - THIS TAKES PRIORITY */}
              {((wallet && wallet.id === "smart") || isSmartWalletActive) && account && (() => {
                // Use existingSmartWalletAddr if available (from connection), otherwise use account.address
                const smartWalletAddr = existingSmartWalletAddr || account.address;
                // Get EOA controller - use eoaAddress if available
                // If not available, we'll need to find it from localStorage mappings
                let controllerAddr = eoaAddress;
                
                // If eoaAddress is not set, try to find it from localStorage
                if (!controllerAddr) {
                  // Search through all localStorage keys to find the mapping
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith("smart_wallet_mapping_")) {
                      try {
                        const mapping = JSON.parse(localStorage.getItem(key) || "{}");
                        if (mapping.smartWalletAddress?.toLowerCase() === smartWalletAddr.toLowerCase()) {
                          controllerAddr = mapping.eoaAddress;
                          break;
                        }
                      } catch (e) {
                        // Ignore parse errors
                      }
                    }
                  }
                }
                
                // Fallback if still not found
                if (!controllerAddr) {
                  controllerAddr = "Your EOA";
                }
                
                return (
                <div className="mb-8 bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full mb-6">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-2xl mb-2">Smart Wallet Active! 🎉</h3>
                  <p className="text-green-200 text-sm mb-6">
                    Your smart wallet is ready for gasless transactions
                  </p>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 text-left">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Wallet Details
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <p className="text-text-muted text-sm">Smart Wallet Address:</p>
                        <p className="text-green-400 font-mono text-sm font-semibold">
                          {smartWalletAddr.slice(0, 10)}...{smartWalletAddr.slice(-8)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <p className="text-text-muted text-sm">EOA Controller:</p>
                        <p className="text-white font-mono text-sm">
                          {controllerAddr.slice(0, 10)}...{controllerAddr.slice(-8)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <p className="text-text-muted text-sm">Network:</p>
                        <p className="text-blue-400 font-semibold text-sm">Base Sepolia</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-text-muted text-sm">Balance:</p>
                        <p className="text-white font-semibold text-sm">
                          {smartWalletBalance ? `${smartWalletBalance} ETH` : "Loading..."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 text-left">
                    <p className="text-blue-300 text-xs font-semibold mb-2">💡 How it works:</p>
                    <ul className="text-blue-200 text-xs space-y-1 list-disc list-inside">
                      <li>Your EOA (MetaMask) signs all transactions</li>
                      <li>Smart wallet executes them gaslessly</li>
                      <li>You stay in full control</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-3 justify-center">
                      <a
                        href={`https://basescan.org/address/${smartWalletAddr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-medium transition-all text-sm"
                      >
                        View on BaseScan
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-lg text-white font-semibold hover:shadow-lg transition-all"
                      >
                        Go to App
                      </button>
                    </div>
                    <p className="text-text-muted text-xs">
                      💡 Note: Transfers to this smart wallet address are gasless! Send ETH here if needed.
                    </p>
                  </div>
                </div>
                );
              })()}

              {/* Show existing smart wallet - needs activation */}
              {existingSmartWalletAddr && wallet && wallet.id !== "smart" && !isSmartWalletActive && !isConnectingToExisting && !isCreating && (
                <div className="mb-8 bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold text-lg mb-2">Smart Wallet Already Exists!</h3>
                  <p className="text-green-200 text-sm mb-4">
                    Your smart wallet is ready. Activate it to use gasless transactions.
                  </p>
                  
                  <div className="bg-white/5 rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-text-muted text-xs">Your EOA (Controller):</p>
                      <p className="text-white font-mono text-xs">
                        {account.address.slice(0, 8)}...{account.address.slice(-6)}
                      </p>
                    </div>
                    <div className="h-px bg-white/10"></div>
                    <div className="flex items-center justify-between">
                      <p className="text-text-muted text-xs">Smart Wallet (Executor):</p>
                      <p className="text-green-400 font-mono text-xs font-semibold">
                        {existingSmartWalletAddr.slice(0, 8)}...{existingSmartWalletAddr.slice(-6)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnectToExistingSmartWallet(existingSmartWalletAddr)}
                    disabled={isConnectingToExisting}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-green-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnectingToExisting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        Activate Smart Wallet
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-text-muted text-xs mt-3">
                    Your EOA will remain connected and in control
                  </p>
                </div>
              )}

              {/* Main CTA - Only show if no existing smart wallet AND not connected as smart wallet */}
              {!existingSmartWalletAddr && !((wallet && wallet.id === "smart") || isSmartWalletActive) && (
                <div className="text-center">
                  {error && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg max-w-md mx-auto">
                      {error}
                    </div>
                  )}
                  
                  {!isCreating && !isConnectingToExisting ? (
                    <>
                      <div className="mb-6">
                        <button
                          onClick={handleCreateSmartWallet}
                          disabled={isCreating}
                          className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-xl font-semibold text-lg text-white hover:shadow-lg hover:shadow-cosmic-blue/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Create Smart Wallet
                          <ArrowRight className="w-6 h-6" />
                        </button>
                      </div>
                      <p className="text-text-muted text-sm mb-2">
                        One-click upgrade to gasless transactions
                      </p>
                      <p className="text-text-muted text-xs">
                        Your current wallet ({account.address.slice(0, 6)}...{account.address.slice(-4)}) will control the smart wallet
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-full mb-6">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                      <p className="text-white font-semibold text-xl mb-3">
                        {isConnectingToExisting ? "Connecting to Smart Wallet..." : "Creating Your Smart Wallet..."}
                      </p>
                      <p className="text-blue-200 text-sm mb-2">{creationStep || "Please wait..."}</p>
                      <p className="text-text-muted text-xs">
                        This will only take a few seconds
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Optional instructions - hidden by default */}
              {showInstructions && (
                <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold text-sm">Alternative Method</h4>
                    <button
                      onClick={() => setShowInstructions(false)}
                      className="text-text-muted hover:text-white text-xs"
                    >
                      Hide
                    </button>
                  </div>
                  <p className="text-text-muted text-xs mb-2">
                    If the button above doesn't work, you can use the ConnectButton in the header.
                  </p>
                </div>
              )}
            </div>

        </div>
      </main>
    </div>
  );
}

