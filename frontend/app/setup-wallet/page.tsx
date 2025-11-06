"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount, useActiveWallet, useConnect } from "thirdweb/react";
import { smartWallet } from "thirdweb/wallets";
import { client, chain, smartWalletConfig } from "@/app/config/thirdweb";
import Header from "@/components/Header";
import { Wallet, Sparkles, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

export default function SetupWalletPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"intro" | "connecting" | "success">("intro");
  const [error, setError] = useState("");

  // Check if user already has a smart wallet
  useEffect(() => {
    if (wallet && wallet.id === "smart") {
      // User already has smart wallet, redirect to home
      router.push("/");
    }
  }, [wallet, router]);

  const { connect: connectWallet, isConnecting } = useConnect();

  const handleCreateSmartWallet = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      setStep("connecting");
      setError("");

      // Create smart wallet that wraps the user's current wallet
      const smartWalletInstance = smartWallet({
        chain: chain,
        sponsorGas: true,
      });

      // Connect the smart wallet with the user's personal account
      await connectWallet({
        wallet: smartWalletInstance,
        strategy: "personal_account",
        personalAccount: account,
      });

      setStep("success");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (err: any) {
      console.error("Error creating smart wallet:", err);
      setError(err.message || "Failed to create smart wallet. Please try again.");
      setStep("intro");
    } finally {
      setLoading(false);
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
          {step === "intro" && (
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
                  <h3 className="text-xl font-semibold text-white mb-2">Secure & Simple</h3>
                  <p className="text-text-muted text-sm">
                    Your existing wallet is protected. Smart wallet wraps it securely.
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

              {/* Current Wallet Info */}
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

              {/* CTA */}
              <div className="text-center">
                {error && (
                  <div className="mb-6 bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg max-w-md mx-auto">
                    {error}
                  </div>
                )}
                <button
                  onClick={handleCreateSmartWallet}
                  disabled={loading}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cosmic-purple to-cosmic-blue rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-cosmic-blue/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Smart Wallet...
                    </>
                  ) : (
                    <>
                      Create Smart Wallet
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-text-muted text-sm mt-4">
                  This will create an ERC-4337 smart wallet that wraps your current wallet
                </p>
              </div>
            </div>
          )}

          {step === "connecting" && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-cosmic-purple mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-4">Creating Your Smart Wallet</h2>
              <p className="text-text-muted">
                Please wait while we set up your gasless smart wallet...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Smart Wallet Created! 🎉</h2>
              <p className="text-text-muted mb-6">
                Your smart wallet is ready. You can now enjoy gasless transactions!
              </p>
              <p className="text-text-muted text-sm">
                Redirecting you to the home page...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

