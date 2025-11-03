const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MinimalForwarder...");

  const MinimalForwarder = await ethers.getContractFactory("MinimalForwarder");
  const forwarder = await MinimalForwarder.deploy();
  await forwarder.waitForDeployment(); // 
  const forwarderAddress = await forwarder.getAddress();
  console.log("MinimalForwarder deployed to:", forwarderAddress);

  console.log("Deploying PrizePoolPredictionGasless...");
  
  const PrizePoolPredictionGasless = await ethers.getContractFactory("PrizePoolPredictionGasless");
  const prediction = await PrizePoolPredictionGasless.deploy(forwarderAddress);
  await prediction.waitForDeployment();
  const predictionAddress = await prediction.getAddress();
  console.log("PrizePoolPredictionGasless deployed to:", predictionAddress);

  return { forwarderAddress, predictionAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying:", error);
    process.exit(1);
  });
