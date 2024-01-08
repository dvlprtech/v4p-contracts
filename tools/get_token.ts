import { publicActions, Hex, WalletClient, createPublicClient, createWalletClient, formatEther, http, PublicActions, Address } from "viem";
import hre from "hardhat";
import PhotoNFT from "../artifacts/contracts/PhotoNFT.sol/PhotoNFT.json";
import { ZERO_ADDRESS } from "../test/test-helpers";

const PHOTONFT_ADDRESS = "0xd2c850c4eb40d96d25b3435ab34894a4454eb1a9";

const DATA = {
  tokenId: 1
}

async function showTokenData() {
  const photoNFT = await hre.viem.getContractAt('PhotoNFT', PHOTONFT_ADDRESS);
  
  const tokenUri = await photoNFT.read.tokenURI([BigInt(DATA.tokenId)]);
  console.log(`Token URI (${DATA.tokenId}): ${tokenUri}`);
  const tokenOwner = await photoNFT.read.ownerOf([BigInt(DATA.tokenId)]);
  console.log(`Token owner (${DATA.tokenId}): ${tokenOwner}`);
}

async function deleteToken() {
  const photoNFT = await hre.viem.getContractAt('PhotoNFT', PHOTONFT_ADDRESS);
  
  console.log(`Vamos a borrar token: ${DATA.tokenId}`);
  await photoNFT.write.burn([BigInt(DATA.tokenId)]);
  const tokenUri = await photoNFT.read.tokenURI([BigInt(DATA.tokenId)]);
  console.log(`Token URI (${DATA.tokenId}): ${tokenUri}`);
  const tokenOwner = await photoNFT.read.ownerOf([BigInt(DATA.tokenId)]);
  console.log(`Token owner (${DATA.tokenId}): ${tokenOwner}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
showTokenData().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
