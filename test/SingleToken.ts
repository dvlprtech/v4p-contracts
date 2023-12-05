import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Account, Address, GetContractReturnType, PublicClient, decodeFunctionResult, getAddress, getCreateAddress, parseGwei } from "viem";
import { ZERO_ADDRESS } from "./test-helpers";

describe("PhotoNFT", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob, carl, david] = await hre.viem.getWalletClients();
    //hre.viem.getContractAt('PhotoNFT', );
    const photoNFT = await hre.viem.deployContract("PhotoNFT", [ZERO_ADDRESS], {});

    const publicClient = await hre.viem.getPublicClient();
    // console.log(' * owner:', owner.account.address, await publicClient.getBalance({ address: owner.account.address }));
    // console.log(' * Alice:', alice.account.address, await publicClient.getBalance({ address: alice.account.address }));
    // console.log(' * Bob:', bob.account.address, await publicClient.getBalance({ address: bob.account.address }));
    // console.log(' * Carl:', carl.account.address, await publicClient.getBalance({ address: carl.account.address }));
    // console.log(' * David:', david.account.address, await publicClient.getBalance({ address: david.account.address }));
    return {
      photoNFT,
      owner,
      alice, bob, carl, david,
      publicClient,
    };
  }

  describe("Photo operations", function () {
    describe("Creation", function () {

      it("Should create a new photo token", async function () {
        const { photoNFT, owner, publicClient } = await loadFixture(deployContractFixture);

        const photoUrl = "https://r2.dvlpr.tech/foto1.json";
        const photoUrl2 = "https://r2.dvlpr.tech/foto2.json";
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = owner.account.address;

        const hash = await photoNFT.write.mintPhoto([photoUrl], { account: tokenOwner });
        await publicClient.waitForTransactionReceipt({ hash });
        const events = await photoNFT.getEvents.newPhotoToken();
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.owner?.toLowerCase()).to.equal(tokenOwner);
        expect(events[0].args.tokenId).to.equal(tokenId);
        expect(events[0].args.tokenUri).to.equal(photoUrl);
        const hash2 = await photoNFT.write.mintPhoto([photoUrl2], { account: tokenOwner });
        await publicClient.waitForTransactionReceipt({ hash: hash2 }); 
        const events2 = await photoNFT.getEvents.newPhotoToken();
        expect(events2[0].args.owner?.toLowerCase()).to.equal(tokenOwner);
        expect(events2[0].args.tokenId).to.equal(tokenId+1n);
        expect(events2[0].args.tokenUri).to.equal(photoUrl2);

        const totalTokens = (await photoNFT.read.balanceOf([tokenOwner]));
        //console.log(tokens);
        expect(totalTokens).to.be.equal(2n, 'The token total mismatch');

      });
    });
  });
});
