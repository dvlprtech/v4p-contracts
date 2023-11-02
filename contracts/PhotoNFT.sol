// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@opengsn/contracts/src/ERC2771Recipient.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract PhotoNFT is ERC721("V4P Photos", "Photo1"), ERC2771Recipient {
    address public contractOwner;

    mapping(uint256 => string) private tokenURIs;
    uint256 private tokenCounter;

    event newPhotoToken(uint256 tokenId, string tokenUri);

    constructor(address trustedForwarded)  {
        tokenCounter = 1;
        contractOwner = msg.sender;
        ERC2771Recipient._setTrustedForwarder(trustedForwarded);
    }

    function nextTokenId() public onlyOwner view returns (uint256) {
        return tokenCounter;
    }

    // Mint a new photo NFT with a given token URI
    function mintPhoto(address to, string memory newTokenURI) public onlyOwner {
        console.log('>>> mintPhoto');
        uint256 tokenId = tokenCounter;
        _mint(to, tokenId);
        tokenURIs[tokenId] = newTokenURI;
        console.log('>>> tokenId: ', tokenId);
        emit newPhotoToken(tokenId, newTokenURI);
    }

    // Retrieve the token URI for a given token ID
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenURIs[tokenId];
    }

    // Update the token URI for a given token ID
    function changeTokenURI(uint256 tokenId, string memory newTokenURI) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == _msgSender(), "Not the owner of the token");
        tokenURIs[tokenId] = newTokenURI;
    }

    // El propietario de un token lo transfiere a otro
    function transferToken(address to, uint256 tokenId) public {
        console.log('>>> transferToken');
        console.log('>>> ownerOf(tokenId):', ownerOf(tokenId));
        console.log('>>> _msgSender():', _msgSender());
        require(ownerOf(tokenId) == _msgSender(), "Not the owner of the token");
        _transfer(ownerOf(tokenId), to, tokenId);
    }

    function _exists(uint256 tokenId) private view returns (bool) {
        return bytes(tokenURIs[tokenId]).length > 0;
    }

    modifier onlyOwner() {
        require(_msgSender() == contractOwner, "Not the owner");
        _;
    }
    
    /// @inheritdoc IERC2771Recipient
    function _msgSender() internal override (ERC2771Recipient, Context) virtual view returns (address ret) {
        return ERC2771Recipient._msgSender();
    }

    /// @inheritdoc IERC2771Recipient
    function _msgData() internal override (ERC2771Recipient, Context) virtual view returns (bytes calldata ret) {
        return ERC2771Recipient._msgData();
    }
}