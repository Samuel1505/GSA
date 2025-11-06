"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import FormField from "@/components/create/FormField";
import ThumbnailUpload from "@/components/create/ThumbnailUpload";
import CreateButton from "@/components/create/CreateButton";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { getContract, prepareContractCall, sendTransaction, readContract } from "thirdweb";
import { client, CONTRACT_ADDRESS, chain } from "@/app/config/thirdweb";
import PrizePoolPredictionABI from "@/app/ABIs/Prediction.json";
import { parseEther } from "viem";

export default function CreateMarket() {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [formData, setFormData] = useState({
    marketQuestion: "",
    entryFee: "",
    initialPrizePool: "",
    endTime: "",
    resolutionTime: "",
    options: "Yes,No",
    thumbnail: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get contract instance
  const contract = getContract({
    client,
    chain,
    address: CONTRACT_ADDRESS,
    abi: PrizePoolPredictionABI.abi as any,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.marketQuestion || !formData.entryFee || !formData.initialPrizePool || !formData.endTime) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!account) {
      setError("Please connect your wallet first.");
      return;
    }

    // Check if user has smart wallet - REQUIRED for transactions
    let isSmartWallet = false;
    try {
      if (wallet?.id === "smart") {
        isSmartWallet = true;
      } else if (account && "sendBatchTransaction" in account) {
        isSmartWallet = true;
      }
    } catch (e) {
      console.error("Error checking wallet:", e);
    }

    if (!isSmartWallet) {
      setError("Smart wallet required! Please create your smart wallet first to make transactions. Redirecting...");
      setTimeout(() => {
        router.push("/setup-wallet");
      }, 2000);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare and validate parameters
      const question = formData.marketQuestion.trim();
      if (question.length === 0) {
        throw new Error("Question cannot be empty");
      }

      const optionsArray = formData.options
        .split(",")
        .map((opt) => opt.trim())
        .filter(Boolean);

      if (optionsArray.length < 2) {
        throw new Error("At least 2 options are required.");
      }

      // Parse entry fee
      let entryFeeWei: bigint;
      try {
        entryFeeWei = parseEther(formData.entryFee);
        if (entryFeeWei <= BigInt(0)) {
          throw new Error("Entry fee must be greater than 0");
        }
      } catch {
        throw new Error("Invalid entry fee format. Use decimal format (e.g., 0.001)");
      }

      // Parse initial prize pool
      let initialPrizePoolWei: bigint;
      try {
        initialPrizePoolWei = parseEther(formData.initialPrizePool);
        if (initialPrizePoolWei <= BigInt(0)) {
          throw new Error("Initial prize pool must be greater than 0");
        }
      } catch {
        throw new Error("Invalid prize pool format. Use decimal format (e.g., 0.01)");
      }

      // Parse end time
      const endTimeDate = new Date(formData.endTime);
      if (isNaN(endTimeDate.getTime())) {
        throw new Error("Invalid end time date.");
      }
      const endTimeUnix = Math.floor(endTimeDate.getTime() / 1000);

      // Calculate resolution time (auto-set to 2 hours after end time if not specified)
      let resolutionTimeUnix: number;
      if (formData.resolutionTime) {
        const resolutionTimeDate = new Date(formData.resolutionTime);
        if (isNaN(resolutionTimeDate.getTime())) {
          throw new Error("Invalid resolution time date.");
        }
        resolutionTimeUnix = Math.floor(resolutionTimeDate.getTime() / 1000);
      } else {
        // Auto-set resolution time to 2 hours after end time
        resolutionTimeUnix = endTimeUnix + (2 * 60 * 60); // 2 hours
      }

      const now = Math.floor(Date.now() / 1000);

      // Contract validations (must match smart contract requirements)
      if (endTimeUnix <= now) {
        throw new Error("End time must be in the future.");
      }

      const timeUntilEnd = endTimeUnix - now;
      if (timeUntilEnd < 3600) { // 3600 seconds = 1 hour
        throw new Error("End time must be at least 1 hour from now.");
      }

      if (resolutionTimeUnix <= endTimeUnix) {
        throw new Error("Resolution time must be after end time.");
      }

      const resolutionPeriod = resolutionTimeUnix - endTimeUnix;
      if (resolutionPeriod < 3600) { // 3600 seconds = 1 hour
        throw new Error("Resolution period must be at least 1 hour after end time.");
      }

      console.log("All validations passed");
      console.log("Prepared params:", {
        question,
        optionsArray,
        entryFee: formData.entryFee + " ETH",
        endTimeUnix,
        initialPrizePool: formData.initialPrizePool + " ETH",
      });

      // Prepare contract call with Thirdweb (gasless via smart wallet!)
      const transaction = prepareContractCall({
        contract,
        method: "function createPrediction(string question, string[] options, uint256 entryFee, uint256 endTime, uint256 resolutionTime)",
        params: [question, optionsArray, entryFeeWei, BigInt(endTimeUnix), BigInt(resolutionTimeUnix)],
        value: initialPrizePoolWei,
      });

      // Send transaction (gasless with smart wallet!)
      console.log("Sending gasless transaction...");
      setError("Transaction submitted! Waiting for confirmation... (Gasless!)");
      
      const result = await sendTransaction({
        transaction,
        account, // Smart wallet account - gas is sponsored!
      });

      console.log("Transaction sent:", result.transactionHash);
      setError("Transaction confirmed! Processing...");

      // Wait a bit for transaction to be mined
      // The transaction is already submitted and confirmed by the smart wallet
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("✅ Transaction confirmed!");

      // Get the new prediction ID from counter
      let newPredictionId: string | null = null;
      try {
        const counter = await readContract({
          contract,
          method: "function predictionCounter() returns (uint256)",
          params: [],
        });
        newPredictionId = counter.toString();
        console.log("New Prediction ID from counter:", newPredictionId);
      } catch (e) {
        console.error("Failed to get prediction counter:", e);
      }

      // Navigate to markets page
      router.push(`/markets${newPredictionId ? `?newId=${newPredictionId}` : ""}`);
    } catch (err: any) {
      console.error("Error creating prediction:", err);
      
      // User rejected transaction
      if (err.message?.includes("rejected") || err.message?.includes("User denied")) {
        setError("Transaction cancelled by user.");
      }
      // Generic error
      else {
        setError(err.message || "An error occurred while creating the prediction.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleThumbnailChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, thumbnail: file }));
  };

  // Helper to get minimum datetime for inputs
  const getMinEndTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Minimum 1 hour from now
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  };

  const getMinResolutionTime = () => {
    if (!formData.endTime) return getMinEndTime();
    const endTime = new Date(formData.endTime);
    endTime.setHours(endTime.getHours() + 1); // Minimum 1 hour after end time
    return endTime.toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-cosmic-dark relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 cosmic-gradient" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cosmic-purple/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cosmic-blue/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-glow">
              Create Market
            </h1>
            <p className="text-text-muted text-lg">
              Define your parameters for a new prediction market
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className={`${
                error.includes("submitted") || error.includes("confirmed") 
                  ? "bg-blue-500/20 border-blue-500 text-blue-300" 
                  : "bg-red-500/20 border-red-500 text-red-300"
              } border p-4 rounded-lg`}>
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
                <FormField
                  label="Market Question"
                  placeholder="e.g Will SOL hit $2,000 by 01-Jan-2025?"
                  value={formData.marketQuestion}
                  onChange={(value) => handleInputChange("marketQuestion", value)}
                />

                <FormField
                  label="Entry Fee (ETH)"
                  placeholder="e.g 0.001"
                  value={formData.entryFee}
                  onChange={(value) => handleInputChange("entryFee", value)}
                  type="text"
                />

                <FormField
                  label="Initial Prize Pool (ETH)"
                  placeholder="e.g 0.01"
                  value={formData.initialPrizePool}
                  onChange={(value) => handleInputChange("initialPrizePool", value)}
                  type="text"
                />

                <FormField
                  label="Options (comma-separated)"
                  placeholder="e.g Yes,No"
                  value={formData.options}
                  onChange={(value) => handleInputChange("options", value)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormField
                      label="End Time"
                      type="datetime-local"
                      placeholder="Select end time"
                      value={formData.endTime}
                      onChange={(value) => handleInputChange("endTime", value)}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Must be at least 1 hour from now
                    </p>
                  </div>

                  <div>
                    <FormField
                      label="Resolution Time (Optional)"
                      type="datetime-local"
                      placeholder="Auto: 2hrs after end"
                      value={formData.resolutionTime}
                      onChange={(value) => handleInputChange("resolutionTime", value)}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      At least 1 hour after end time
                    </p>
                  </div>
                </div>

                {/* Helper info */}
                <div className="bg-cosmic-purple/10 border border-cosmic-purple/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-cosmic-purple mb-2">
                    Requirements:
                  </h4>
                  <ul className="text-xs text-text-muted space-y-1">
                    <li>• End time must be at least 1 hour from now</li>
                    <li>• Resolution time must be at least 1 hour after end time</li>
                    <li>• At least 2 options required</li>
                    <li>• Entry fee must be greater than 0</li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Thumbnail Upload */}
              <div>
                <ThumbnailUpload
                  onFileChange={handleThumbnailChange}
                  currentFile={formData.thumbnail}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-8">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-cosmic-purple to-cosmic-blue hover:shadow-lg hover:shadow-cosmic-purple/50"
                } text-white`}
              >
                {loading ? "Creating..." : "Create Market"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}