pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract PhotoNFT is ERC721 {
    address public contractOwner;

    mapping(uint256 => string) private tokenURIs;
    uint256 private tokenCounter;

    event newPhotoToken(uint256 tokenId, string tokenUri);

    constructor() ERC721("V4P Photos", "PHO1") {
        tokenCounter = 1;
        contractOwner = msg.sender;
    }

    function nextTokenId() public onlyOwner view returns (uint256) {
        return tokenCounter;
    }

    // Mint a new photo NFT with a given token URI
    function mintPhoto(address to, string memory newTokenURI) public onlyOwner {
        uint256 tokenId = tokenCounter;
        _mint(to, tokenId);
        tokenURIs[tokenId] = newTokenURI;
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
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the token");
        tokenURIs[tokenId] = newTokenURI;
    }

    // El propietario de un token lo transfiere a otro
    function transferToken(address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of the token");
        _transfer(msg.sender, to, tokenId);
    }

    function _exists(uint256 tokenId) private view returns (bool) {
        return bytes(tokenURIs[tokenId]).length > 0;
    }

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Not the owner");
        _;
    }
}