import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Account, Address, GetContractReturnType, PublicClient, decodeFunctionResult, getAddress, getCreateAddress, parseGwei } from "viem";

describe("PhotoNFT", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractFixture() {

    // Contracts are deployed using the first signer/account by default
    const [owner, account1, account2] = await hre.viem.getWalletClients();

    const photoNFT = await hre.viem.deployContract("PhotoNFT", [], {});

    const publicClient = await hre.viem.getPublicClient();
    console.log('owner:', owner.account.address);
    console.log('account1:', account1.account.address);
    console.log('account2:', account2.account.address);
    return {
      photoNFT,
      owner,
      account1,
      account2,
      publicClient,
    };
  }

  describe("Deployment", function () {
    it("Should create an empty token contract", async function () {
      const { photoNFT } = await loadFixture(deployContractFixture);
      
      expect(await photoNFT.read.nextTokenId()).to.equal(BigInt(1));
    });

    it("Should set the right owner", async function () {
      const { photoNFT, owner } = await loadFixture(deployContractFixture);

      expect(await photoNFT.read.contractOwner()).to.equal(getAddress(owner.account.address));
    });

  });

  describe("Photo operations", function () {
    describe("Creation", function () {
      async function createPhotoToken(photoNFT: any, addr: string, publicClient: PublicClient, photoUrl: string) {
      }
      it("Should create a new photo token", async function () {
        const { photoNFT, owner, account1, publicClient } = await loadFixture(deployContractFixture);
        
        const photoUrl = "http://example.com/photo1.json?random="+Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = account1.account.address;
        const hash = await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
        await publicClient.waitForTransactionReceipt({ hash });
        const events = await photoNFT.getEvents.newPhotoToken();
        expect(events).to.have.lengthOf(1);
        expect(events[0].args.tokenId).to.equal(tokenId);
        expect(events[0].args.tokenUri).to.equal(photoUrl);
        const savedTokenOwner = (await photoNFT.read.ownerOf([tokenId])).toLowerCase();
        expect(savedTokenOwner).to.be.equal(tokenOwner.toLowerCase(), 'The token owner mismatch');
        
      });
    });
    describe("Modifications", function () {
      it("Should token uri match with tokenID", async function () {
        const { photoNFT, owner, account1, publicClient } = await loadFixture(deployContractFixture);
        
        const photoUrl = "http://example.com/photo1.json?random="+Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = owner.account.address;
        const hash = await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
        await publicClient.waitForTransactionReceipt({ hash });
        
        const savedTokenUri = await photoNFT.read.tokenURI([tokenId]);
        expect(savedTokenUri).to.be.equal(photoUrl, 'The token uri mismatch');        
      });

      it("Should change tokenUri for contract owner", async function () {
        const { photoNFT, owner, account1, publicClient } = await loadFixture(deployContractFixture);
        
        const photoUrl = "http://example.com/photo1.json?random="+Math.random();
        const photoUrl2 = "http://example.com/photo2.json?random="+Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = owner.account.address;
        await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
        await photoNFT.write.changeTokenURI([tokenId, photoUrl2]);        
        
        const savedTokenUri = await photoNFT.read.tokenURI([tokenId]);
        expect(savedTokenUri).to.be.equal(photoUrl2, 'The token uri mismatch');        
      });
      it("Should reject change tokenUri for other owner", async function () {
        const { photoNFT, owner, account1, publicClient } = await loadFixture(deployContractFixture);
        
        const photoUrl = "http://example.com/photo1.json?random="+Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = account1.account.address;
        await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
        await expect(photoNFT.write.changeTokenURI([tokenId, photoUrl]))
          .to.be.rejectedWith("Not the owner of the token");
      });
      it("Should reject change for missing tokenId", async function () {
        const { photoNFT, account1 } = await loadFixture(deployContractFixture);
        
        await expect(photoNFT.write.changeTokenURI([9999n, "whatever"]))
          .to.be.rejectedWith("Token does not exist");
      });
      it("Should transfer a token", async function () {
        const { photoNFT, owner, account1, publicClient } = await loadFixture(deployContractFixture);
        
        const photoUrl = "http://example.com/photo1.json?random="+Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = owner.account.address;
        await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
        await photoNFT.write.transferToken([account1.account.address, tokenId]);
        const newTokenOwner = (await photoNFT.read.ownerOf([tokenId])).toLowerCase();
        expect(newTokenOwner).to.be.eq(account1.account.address.toLowerCase());
      });
      it("Should reject a token transfer if not its owner", async function () {
        const { photoNFT, owner, account1, publicClient } = await loadFixture(deployContractFixture);
        
        const photoUrl = "http://example.com/photo1.json?random="+Math.random();
        const tokenId = await photoNFT.read.nextTokenId();
        const tokenOwner = account1.account.address;
        await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
        await expect(photoNFT.write.transferToken([owner.account.address, tokenId]))
          .to.be.rejectedWith("Not the owner of the token");
      });
    });
  });
  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployContractFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We retrieve the contract with a different account to send a transaction
  //       const lockAsOtherAccount = await hre.viem.getContractAt(
  //         "Lock",
  //         lock.address,
  //         { walletClient: otherAccount }
  //       );
  //       await expect(lockAsOtherAccount.write.withdraw()).to.be.rejectedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployContractFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.write.withdraw()).to.be.fulfilled;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount, publicClient } =
  //         await loadFixture(deployContractFixture);

  //       await time.increaseTo(unlockTime);

  //       const hash = await lock.write.withdraw();
  //       await publicClient.waitForTransactionReceipt({ hash });

  //       // get the withdrawal events in the latest block
  //       const withdrawalEvents = await lock.getEvents.Withdrawal()
  //       expect(withdrawalEvents).to.have.lengthOf(1);
  //       expect(withdrawalEvents[0].args.amount).to.equal(lockedAmount);
  //     });
  //   });
  // });
});
