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

  describe("Deployment", function () {
    it("Should create an empty token contract", async function () {
      const { photoNFT } = await loadFixture(deployContractFixture);

      expect(await photoNFT.read.nextTokenId()).to.equal(1n);
    });
    it("Should set the right trusted forwarder", async function () {
      const { photoNFT } = await loadFixture(deployContractFixture);

      expect(await photoNFT.read.isTrustedForwarder([ZERO_ADDRESS])).to.be.true;
    });

  });

  describe("Photo operations", function () {
    describe("Creation", function () {

      it("Should create a new photo token", async function () {
        const { photoNFT, carl, publicClient } = await loadFixture(deployContractFixture);

        const photoUrl = "http://example.com/photo1.json?random=" + Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = carl.account.address;
        await photoNFT.write.addMinter([tokenOwner]);
        const hash = await photoNFT.write.mintPhoto([photoUrl], { account: tokenOwner });
        await publicClient.waitForTransactionReceipt({ hash });
        const events = await photoNFT.getEvents.newPhotoToken();
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.tokenId).to.equal(tokenId);
        expect(events[0].args.tokenUri).to.equal(photoUrl);
        const savedTokenOwner = (await photoNFT.read.ownerOf([tokenId])).toLowerCase();
        expect(savedTokenOwner).to.be.equal(tokenOwner.toLowerCase(), 'The token owner mismatch');

      });
      it("Should reject a photo token mint", async function () {
        const { photoNFT, david, publicClient } = await loadFixture(deployContractFixture);

        const photoUrl = "http://example.com/photo1.json?random=" + Math.random();
        
        const tokenOwner = david.account.address;
        await expect(photoNFT.write.mintPhoto([photoUrl], { account: tokenOwner }))
          .to.be.rejectedWith("Forbidden");
      });
      it("Should reject a photo token mint after revocation", async function () {
        const { photoNFT, david } = await loadFixture(deployContractFixture);

        const photoUrl = "http://example.com/photo1.json?random=" + Math.random();
        const photoUrl2 = "http://example.com/photo1.json?random=" + Math.random();
        
        const tokenOwner = david.account.address;
        await photoNFT.write.addMinter([tokenOwner]);        
        await photoNFT.write.mintPhoto([photoUrl], { account: tokenOwner });
        await photoNFT.write.removeMinter([tokenOwner]);
        await expect(photoNFT.write.mintPhoto([photoUrl2], { account: tokenOwner }))
          .to.be.rejectedWith("Forbidden");
      });
    });
    describe("Modifications", function () {
      it("Should token uri match with tokenID", async function () {
        const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);

        const photoUrl = "http://example.com/photo1.json?random=" + Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = owner.account.address;
        const hash = await photoNFT.write.mintPhoto([photoUrl], { account: tokenOwner });
        await publicClient.waitForTransactionReceipt({ hash });

        const savedTokenUri = await photoNFT.read.tokenURI([tokenId]);
        expect(savedTokenUri).to.be.equal(photoUrl, 'The token uri mismatch');
      });

      it("Should transfer a token", async function () {
        const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);

        const photoUrl = "http://example.com/photo1.json?random=" + Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = owner.account.address;
        await photoNFT.write.mintPhoto([photoUrl], { account: tokenOwner });
        await photoNFT.write.transferToken([alice.account.address, tokenId]);
        const newTokenOwner = (await photoNFT.read.ownerOf([tokenId])).toLowerCase();
        expect(newTokenOwner).to.be.eq(alice.account.address.toLowerCase());
      });
      it("Should reject a token transfer if not its owner", async function () {
        const { photoNFT, owner, carl } = await loadFixture(deployContractFixture);

        const photoUrl = "http://example.com/photo1.json?random=" + Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = carl.account.address;
        await photoNFT.write.addMinter([tokenOwner]);
        await photoNFT.write.mintPhoto([photoUrl], { account: tokenOwner });
        await expect(photoNFT.write.transferToken([owner.account.address, tokenId]))
          .to.be.rejectedWith("Not the owner of the token");
      });
    });
  });
});
