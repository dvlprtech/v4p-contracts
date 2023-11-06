import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { encodeFunctionData } from 'viem'
import { expect } from "chai";
import hre from "hardhat";
import { Address, WalletClient } from "viem";


type EIP712Domain = {
  name: string,
  version: string,
  chainId: number,
  verifyingContract: Address,
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
  ]
}



describe("V4PForwarder", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractFixture() {
    
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob, carl, david] = await hre.viem.getWalletClients();
    
    
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
    }

    // console.log('Alice key:', alice.key);
    // console.log(' * recipient:', photoNFT.address);
    // console.log(' * forwarder:', forwarder.address);
    // console.log(' * owner:', owner.account.address, await publicClient.getBalance({ address: owner.account.address}));
    // console.log(' * Alice:', alice.account.address, await publicClient.getBalance({ address: alice.account.address }));
    // console.log(' * Bob:', bob.account.address, await publicClient.getBalance({ address: bob.account.address }));
    // console.log(' * Carl:', carl.account.address, await publicClient.getBalance({ address: carl.account.address }));
    // console.log(' * David:', david.account.address, await publicClient.getBalance({ address: david.account.address }));
    return {
      forwarder,
      photoNFT,
      owner,
      alice, bob, carl, david,      
      domain,
      publicClient,
    };
  }

  async function signRequestData(signer: WalletClient, message: ForwardRequest, domain: EIP712Domain) {

    const signature = await signer.signTypedData({
      account: signer.account!.address,
      message,
      types: {ForwardRequest: TYPES.ForwardRequest},
      primaryType: "ForwardRequest",
      domain: {...domain} as const,      
    });
    return {
      message,
      signature
    }
  }

  async function _getMessageToSign(data : {
    from: Address, 
    to: Address,
    data: `0x${string}`,
    nonce: bigint
  }) : Promise<ForwardRequest> {

    return {
      ...data,      
      gas: 1_000_000n,
      deadline: (await time.latest()) + 60,
      value: 0n
    };
  }

  function _abiTransferTokenCallEncoded(account: Address, tokenId: bigint = 1n) : `0x${string}` {

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
    return methodEncoded; // fnSignatureTransfer+fnParamsTransfer.substring(2) as `0x${string}`;
  }

  function _abiMintPhotoCallEncoded(photoUri: string) : `0x${string}` {

    const methodEncoded = encodeFunctionData({
      abi: [{
        inputs: [
          {name: 'newTokenURI', type: 'string'}
        ],
        name: 'mintPhoto',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      }],
      args: [photoUri]
    });
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

      
      const message = await _getMessageToSign({
        from: alice.account.address,
        to: photoNFT.address,
        data: _abiTransferTokenCallEncoded(alice.account.address),
        nonce: await forwarder.read.nonces([alice.account.address])
      });
      const { signature } = await signRequestData(alice, message, domain);
      expect(signature).not.to.be.null;
    });
    it("Should create and reject a signed request", async function () {
      const { photoNFT, forwarder, carl, alice, bob, domain, publicClient } = await loadFixture(deployContractFixture);

      const message = await _getMessageToSign({
        from: alice.account.address,
        to: photoNFT.address,
        data: _abiMintPhotoCallEncoded("photo_uri_example"),
        nonce: await forwarder.read.nonces([alice.account.address])
      });
      const signature = '0x000000000000000000000000000000000'; // bad signature
      const signedMessage : SignedForwardRequest = {
        ...message,
        signature
      }
      
      const isValid = await forwarder.read.verify([signedMessage]);
      expect(isValid).to.be.false;
    });

    it("Should create and verify a signed request for mintPhoto()", async function () {
      const { photoNFT, forwarder, carl, alice, bob, domain, publicClient } = await loadFixture(deployContractFixture);

      const message = await _getMessageToSign({
        from: alice.account.address,
        to: photoNFT.address,
        data: _abiMintPhotoCallEncoded("photo_uri_example"),
        nonce: await forwarder.read.nonces([alice.account.address])
      });
      const { signature } = await signRequestData(alice, message, domain);
      const signedMessage : SignedForwardRequest = {
        ...message,
        signature
      }
      
      expect(signature).not.to.be.null;
      const isValid = await forwarder.read.verify([signedMessage]);
      expect(isValid).to.be.true;
    });

    it("Should create and verify a signed request for transferToken()", async function () {
      const { photoNFT, forwarder, carl, alice, bob, domain, publicClient } = await loadFixture(deployContractFixture);

      const message = await _getMessageToSign({
        from: alice.account.address,
        to: photoNFT.address,
        data: _abiTransferTokenCallEncoded(bob.account.address),
        nonce: await forwarder.read.nonces([alice.account.address])
      });
      const { signature } = await signRequestData(alice, message, domain);
      expect(signature).not.to.be.null;
      const signedMessage : SignedForwardRequest = {
        ...message,
        signature
      }
     
      const isValid = await forwarder.read.verify([signedMessage]);
      expect(isValid).to.be.true;
    });

    it("Should reject a call from unknown relayer", async function () {
      const { photoNFT, forwarder, carl, alice } = await loadFixture(deployContractFixture);

      const message = await _getMessageToSign({
        from: alice.account.address,
        to: photoNFT.address,
        data: _abiMintPhotoCallEncoded("photo_uri_example"),
        nonce: await forwarder.read.nonces([alice.account.address])
      });
      const signature = '0x000000000000000000000000000000000'; // bad signature
      const signedMessage : SignedForwardRequest = {
        ...message,
        signature
      }
      
      await expect( forwarder.read.verify([signedMessage], {account: carl.account.address}))
      .to.be.rejectedWith("Unknown relayer");
      
    });


  });
  describe("Meta-transactions", function () {

    it("Should create and execute a meta-transaction for mintPhoto()", async function () {
      const { photoNFT, forwarder, alice, domain, publicClient } = await loadFixture(deployContractFixture);

      const message = await _getMessageToSign({
        from: alice.account.address,
        to: photoNFT.address,
        data: _abiMintPhotoCallEncoded("photo_uri_example"),
        nonce: await forwarder.read.nonces([alice.account.address])
      });
      const { signature } = await signRequestData(alice, message, domain);
      expect(signature).not.to.be.null;
      const signedMessage : SignedForwardRequest = {
        ...message,
        signature
      }
      
      const aliceBalance = await publicClient.getBalance({ address: alice.account.address});
      expect(aliceBalance).to.be.eq(0n);
      
      await photoNFT.write.addMinter([alice.account.address]);

      await forwarder.write.execute([signedMessage]);
      const photoOwner = await photoNFT.read.ownerOf([1n]);
      expect(photoOwner.toLowerCase()).to.be.equal(alice.account.address);
      
      const aliceTokens = await photoNFT.read.balanceOf([alice.account.address]);
      expect(aliceTokens).to.be.eq(1n);
    });

    
    it("Should create and execute a meta-transaction for transferPhoto()", async function () {
      const { photoNFT, forwarder, carl, alice, bob, domain, publicClient } = await loadFixture(deployContractFixture);
      const tokenId = 1n; // first created token
      await photoNFT.write.mintPhoto(["photo_uri_example"]); // token created by contract owner
      await photoNFT.write.transferToken([alice.account.address, tokenId]); // token transfered by owner to Alice
      
      const aliceBalance = await publicClient.getBalance({ address: alice.account.address});
      const bobBalance = await publicClient.getBalance({ address: bob.account.address});
      expect(bobBalance + aliceBalance).to.be.eq(0n);

      const message = await _getMessageToSign({
        from: alice.account.address,
        to: photoNFT.address,
        data: _abiTransferTokenCallEncoded(bob.account.address, tokenId),
        nonce: await forwarder.read.nonces([alice.account.address])
      });
      const { signature } = await signRequestData(alice, message, domain);
      expect(signature).not.to.be.null;
      const signedMessage : SignedForwardRequest = {
        ...message,
        signature
      }

      const currentPhotoOwner = await photoNFT.read.ownerOf([tokenId]);
      expect(currentPhotoOwner.toLowerCase()).to.be.equal(alice.account.address);

      await forwarder.write.execute([signedMessage]);
      const photoOwner = await photoNFT.read.ownerOf([tokenId]);
      expect(photoOwner.toLowerCase()).to.be.equal(bob.account.address);
      
      const bobTokens = await photoNFT.read.balanceOf([bob.account.address]);
      expect(bobTokens).to.be.eq(1n); // Bob should have 1 token
    });    
  });  
});
