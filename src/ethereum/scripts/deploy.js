const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment of Cross-Chain Swap contracts...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  try {
    // Deploy HashTimeLockContract
    console.log("\nDeploying HashTimeLockContract...");
    const HashTimeLockContract = await ethers.getContractFactory("HashTimeLockContract");
    const htlc = await HashTimeLockContract.deploy();
    await htlc.waitForDeployment();
    
    const htlcAddress = await htlc.getAddress();
    console.log("HashTimeLockContract deployed to:", htlcAddress);
    
    // Deploy CrossChainSwapManager (if you have one)
    console.log("\nDeploying CrossChainSwapManager...");
    const CrossChainSwapManager = await ethers.getContractFactory("CrossChainSwapManager");
    const swapManager = await CrossChainSwapManager.deploy(htlcAddress);
    await swapManager.waitForDeployment();
    
    const swapManagerAddress = await swapManager.getAddress();
    console.log("CrossChainSwapManager deployed to:", swapManagerAddress);
    
    // Deploy ERC20 test token (for testing purposes)
    console.log("\nDeploying TestToken...");
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
    await testToken.waitForDeployment();
    
    const testTokenAddress = await testToken.getAddress();
    console.log("TestToken deployed to:", testTokenAddress);
    
    // Verify deployment
    console.log("\n=== Deployment Summary ===");
    console.log("Network:", network.name);
    console.log("Deployer:", deployer.address);
    console.log("HashTimeLockContract:", htlcAddress);
    console.log("CrossChainSwapManager:", swapManagerAddress);
    console.log("TestToken:", testTokenAddress);
    
    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      deployer: deployer.address,
      contracts: {
        HashTimeLockContract: htlcAddress,
        CrossChainSwapManager: swapManagerAddress,
        TestToken: testTokenAddress
      },
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber()
    };
    
    const fs = require("fs");
    const path = require("path");
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${deploymentFile}`);
    
    // Instructions for next steps
    console.log("\n=== Next Steps ===");
    console.log("1. Update your frontend configuration with the deployed contract addresses");
    console.log("2. Verify contracts on Etherscan (if on mainnet/testnet):");
    console.log(`   npx hardhat verify --network ${network.name} ${htlcAddress}`);
    console.log(`   npx hardhat verify --network ${network.name} ${swapManagerAddress} ${htlcAddress}`);
    console.log(`   npx hardhat verify --network ${network.name} ${testTokenAddress} "Test Token" "TEST" "1000000000000000000000000"`);
    console.log("3. Update your canister with the Ethereum contract addresses");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });