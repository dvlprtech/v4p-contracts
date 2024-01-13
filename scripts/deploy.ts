import { publicActions, Hex, WalletClient, createPublicClient, createWalletClient, formatEther, http, PublicActions, Address } from "viem";
import hre from "hardhat";

async function deploy() {
  if (!['hardhat', 'sepolia', 'localhost'].includes(hre.network.name)) {
    throw new Error("This script should only be run on hardhat/sepolia network");
  }
  const [walletClient] = await hre.viem.getWalletClients();

  console.log(`Connected to chain ID: ${await walletClient.getChainId()}, Network: ${walletClient.chain.name}, Currency: ${walletClient.chain.nativeCurrency.symbol}`);  
  const forwarder = await hre.viem.deployContract("V4PForwarder", [], {});

  const trustedRelayer = await forwarder.read.trustedRelayer();
  console.log(`Forwarder (${forwarder.address}) deployed for trustedRelayer: ${trustedRelayer}`);

  const photoNFT = await hre.viem.deployContract("PhotoNFT", [forwarder.address], {});
  const trustedForwarder = await photoNFT.read.getTrustedForwarder();
  console.log(`PhotoNFT (${photoNFT.address}) deployed for trustedRelayer (forwarder): ${trustedForwarder}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
