import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { keccak256, encodeAbiParameters, WalletActions, encodeFunctionData, Abi } from 'viem'
import { expect } from "chai";
import hre from "hardhat";
import { Account, Address, WalletClient, getAddress } from "viem";

//import {} from '@openzeppelin/he'
import { ZERO_ADDRESS } from "./test-helpers";
import { SignTypedDataVersion, signTypedData } from "@metamask/eth-sig-util";
const encoder = new TextEncoder(); // always utf-8
const ALICE_PRIVATE_KEY = '0x0202020202020202020202020202020202020202020202020202020202020202';

const DOMAIN = {
  name: 'Vote4Photo',
  version: '1'
}
type EIP712Domain = {
  name: string,
  version: string,
  chainId: number,
  verifyingContract: Address,
//  salt?: `0x${string}`
}

type ForwardRequest = {
  from: Address
  to: Address,
  value: bigint,
  gas: bigint,
  deadline: number,
  data: `0x${string}`,
  nonce?: bigint,
}

type SignedForwardRequest = ForwardRequest & {
  signature: `0x${string}`
}

const TYPES = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },        
    { name: 'deadline', type: 'uint48' },
    { name: 'data', type: 'bytes' },    
  ],
  EIP712Domain : [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
  //  { name: 'salt', type: 'bytes32' },
  ]
}



describe("V4PForwarder", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractFixture() {
    
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await hre.viem.getWalletClients();
    
    
    const forwarder = await hre.viem.deployContract("V4PForwarder", [], {});
    const photoNFT = await hre.viem.deployContract("PhotoNFT", [forwarder.address], {});

    const publicClient = await hre.viem.getPublicClient();
    publicClient.getEnsAddress
    const [ fields, name, version, chainId, verifyingContract, salt, extensions ] = await forwarder.read.eip712Domain();

    const domain: EIP712Domain = {
      name,
      version,
      chainId: Number(chainId),
      verifyingContract,
      //salt //: Buffer.from(salt.substring(2), 'hex')
    }

    console.log('Alice key:', alice.key);
    console.log(' * recipient:', photoNFT.address);
    console.log(' * forwarder:', forwarder.address);
    console.log(' * owner:', owner.account.address, await publicClient.getBalance({ address: owner.account.address}));
    console.log(' * alice:', alice.account.address, await publicClient.getBalance({ address: alice.account.address}));
    console.log(' * bob:', bob.account.address, await publicClient.getBalance({ address: bob.account.address}));
    return {
      forwarder,
      photoNFT,
      owner,
      alice,
      bob,
      domain,
      publicClient,
    };
  }

  async function signRequestData(signer: WalletClient, message: ForwardRequest, domain: EIP712Domain) {
    const data = {
      account: signer.account!.address,
      message,
      types: TYPES,
      primaryType: "ForwardRequest",
      domain: {...domain} as const,      
    } as const;

    const signature = signTypedData({
      privateKey: Buffer.from(ALICE_PRIVATE_KEY.substring(2), 'hex'), 
      data,
      version: SignTypedDataVersion.V4}) as `0x${string}`;
    const signature2 = await signer.signTypedData({
      account: signer.account!.address,
      message,
      types: {ForwardRequest: TYPES.ForwardRequest},
      primaryType: "ForwardRequest",
      domain: {...domain} as const,      
    });
    console.log('DOMAIN:', domain);
    console.log('sign1:', signature);
    console.log('sign2:', signature2);
    return {
      message,
      signature
    }
  }

  function abiMethodCallEncodec(account: Address, tokenId: bigint = 1n) : `0x${string}` {
    const fnSignatureTransfer = keccak256(encoder.encode('transferToken(address,uint256)'));
    let fnParamsTransfer = encodeAbiParameters(
      [
        {name: 'to', type: 'address'}, 
        {name: 'tokenId', type: 'uint256'}],
      [account, tokenId]
    );
    console.log('fnSignatureTransfer:',fnSignatureTransfer);
    console.log('fnParamsTransfer:',fnParamsTransfer);
    const methodEncoded = encodeFunctionData({
      abi: [{
        inputs: [
          {name: 'to', type: 'address'}, 
          {name: 'tokenId', type: 'uint256'}],
        name: 'transferToken',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      }],
      args: [account, tokenId]
    });
    console.log('Methods:');
    console.log(methodEncoded);
    console.log(fnSignatureTransfer.substring(0,10)+fnParamsTransfer.substring(2) );
    return methodEncoded; // fnSignatureTransfer+fnParamsTransfer.substring(2) as `0x${string}`;
  }

  describe("Deployment", function () {
    it("Should create a token contract with the proper trusted forwarder", async function () {
      const { photoNFT, forwarder } = await loadFixture(deployContractFixture);
      
      expect((await photoNFT.read.getTrustedForwarder()).toLowerCase()).to.equal(forwarder.address);
    });
  });
  
  describe("Signature", function () {
    it("Should create a signature", async function () {
      const { photoNFT, forwarder, owner, alice, bob, domain } = await loadFixture(deployContractFixture);

      
      const message: ForwardRequest = {
        from: alice.account.address,
        to: photoNFT.address,
        data: abiMethodCallEncodec(alice.account.address),
        gas: 1_000_000n,
        deadline: 0,
        value: 0n,
        nonce: await forwarder.read.nonces([alice.account.address])
      }
      const { signature } = await signRequestData(alice, message, domain);
      expect(signature).not.to.be.null;
    });
    it("Should create and verify a signed request", async function () {
      const { photoNFT, forwarder, owner, alice, bob, domain, publicClient } = await loadFixture(deployContractFixture);

      const message: ForwardRequest = {
        from: alice.account.address,
        to: photoNFT.address,
        data: abiMethodCallEncodec(bob.account.address),
        gas: 1_000_000n,
        deadline: (await time.latest()) + 60,
        value: 0n,
        nonce: await forwarder.read.nonces([alice.account.address])
      }
      const { signature } = await signRequestData(alice, message, domain);
      const signedMessage : SignedForwardRequest = {
        ...message,
        signature
      }
      
      const aliceBalance = await publicClient.getBalance({ address: alice.account.address});
      const bobBalance = await publicClient.getBalance({ address: bob.account.address});
      expect(bobBalance + aliceBalance).to.be.eq(0n);
      
      expect(signature).not.to.be.null;
      const isValid = await forwarder.read.verify([signedMessage]);
      expect(isValid).to.be.true;
      await photoNFT.write.mintPhoto([alice.account.address, 'hola_url_photo']);

      const initialBobTokens = await photoNFT.read.balanceOf([bob.account.address]);
      expect(initialBobTokens).to.be.eq(0n);

      await forwarder.write.execute([signedMessage]);
      const photoOwner = await photoNFT.read.ownerOf([1n]);
      expect(photoOwner.toLowerCase()).to.be.equal(bob.account.address);
      
      const bobTokens = await photoNFT.read.balanceOf([bob.account.address]);
      const aliceTokens = await photoNFT.read.balanceOf([alice.account.address]);
      expect(bobTokens).to.be.eq(1n);
      expect(aliceTokens).to.be.eq(0n);
    });
  });

  // describe("Photo operations", function () {
  //   describe("Creation", function () {
  //     async function createPhotoToken(photoNFT: any, addr: string, publicClient: PublicClient, photoUrl: string) {
  //     }
  //     it("Should create a new photo token", async function () {
  //       const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);
        
  //       const photoUrl = "http://example.com/photo1.json?random="+Math.random();
  //       const tokenId = await photoNFT.read.nextTokenId();
  //       const tokenOwner = alice.account.address;
  //       const hash = await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
  //       await publicClient.waitForTransactionReceipt({ hash });
  //       const events = await photoNFT.getEvents.newPhotoToken();
  //       expect(events).to.have.lengthOf(1);
  //       expect(events[0].args.tokenId).to.equal(tokenId);
  //       expect(events[0].args.tokenUri).to.equal(photoUrl);
  //       const savedTokenOwner = (await photoNFT.read.ownerOf([tokenId])).toLowerCase();
  //       expect(savedTokenOwner).to.be.equal(tokenOwner.toLowerCase(), 'The token owner mismatch');
        
  //     });
  //   });
  //   describe("Modifications", function () {
  //     it("Should token uri match with tokenID", async function () {
  //       const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);
        
  //       const photoUrl = "http://example.com/photo1.json?random="+Math.random();
  //       const tokenId = await photoNFT.read.nextTokenId();
  //       const tokenOwner = owner.account.address;
  //       const hash = await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
  //       await publicClient.waitForTransactionReceipt({ hash });
        
  //       const savedTokenUri = await photoNFT.read.tokenURI([tokenId]);
  //       expect(savedTokenUri).to.be.equal(photoUrl, 'The token uri mismatch');        
  //     });

  //     it("Should change tokenUri for contract owner", async function () {
  //       const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);
        
  //       const photoUrl = "http://example.com/photo1.json?random="+Math.random();
  //       const photoUrl2 = "http://example.com/photo2.json?random="+Math.random();
  //       const tokenId = await photoNFT.read.nextTokenId();
  //       const tokenOwner = owner.account.address;
  //       await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
  //       await photoNFT.write.changeTokenURI([tokenId, photoUrl2]);        
        
  //       const savedTokenUri = await photoNFT.read.tokenURI([tokenId]);
  //       expect(savedTokenUri).to.be.equal(photoUrl2, 'The token uri mismatch');        
  //     });
  //     it("Should reject change tokenUri for other owner", async function () {
  //       const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);
        
  //       const photoUrl = "http://example.com/photo1.json?random="+Math.random();
  //       const tokenId = await photoNFT.read.nextTokenId();
  //       const tokenOwner = alice.account.address;
  //       await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
  //       await expect(photoNFT.write.changeTokenURI([tokenId, photoUrl]))
  //         .to.be.rejectedWith("Not the owner of the token");
  //     });
  //     it("Should reject change for missing tokenId", async function () {
  //       const { photoNFT, alice } = await loadFixture(deployContractFixture);
        
  //       await expect(photoNFT.write.changeTokenURI([9999n, "whatever"]))
  //         .to.be.rejectedWith("Token does not exist");
  //     });
  //     it("Should transfer a token", async function () {
  //       const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);
        
  //       const photoUrl = "http://example.com/photo1.json?random="+Math.random();
  //       const tokenId = await photoNFT.read.nextTokenId();
  //       const tokenOwner = owner.account.address;
  //       await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
  //       await photoNFT.write.transferToken([alice.account.address, tokenId]);
  //       const newTokenOwner = (await photoNFT.read.ownerOf([tokenId])).toLowerCase();
  //       expect(newTokenOwner).to.be.eq(alice.account.address.toLowerCase());
  //     });
  //     it("Should reject a token transfer if not its owner", async function () {
  //       const { photoNFT, owner, alice, publicClient } = await loadFixture(deployContractFixture);
        
  //       const photoUrl = "http://example.com/photo1.json?random="+Math.random();
  //       const tokenId = await photoNFT.read.nextTokenId();
  //       const tokenOwner = alice.account.address;
  //       await photoNFT.write.mintPhoto([tokenOwner, photoUrl]);
  //       await expect(photoNFT.write.transferToken([owner.account.address, tokenId]))
  //         .to.be.rejectedWith("Not the owner of the token");
  //     });
  //   });
  // });
});
