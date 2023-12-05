import { formatEther, parseEther } from "viem";
import hre from "hardhat";
//import { ethers } from "hardhat";

async function main() {
  const [owner] = await hre.viem.getWalletClients();
  
  console.log(`Connected to chain ID: ${await owner.getChainId()}, Network: ${owner.chain.name}, Currency: ${owner.chain.nativeCurrency.symbol}`);
  const forwarder = await hre.viem.deployContract("V4PForwarder", [], {});
  const photoNFT = await hre.viem.deployContract("PhotoNFT", [forwarder.address], {});
  //await forwarder.w
  const trustedRelayer = await forwarder.read.trustedRelayer();
  const trustedForwarder = await photoNFT.read.getTrustedForwarder();
  
  console.log(`Forwarder (${forwarder.address}) deployed for trustedRelayer: ${trustedRelayer}`);
  console.log(`PhotoNFT (${photoNFT.address}) deployed for rustedRelayer: ${trustedForwarder}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
