// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@opengsn/contracts/src/ERC2771Recipient.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

/**
 * @title PhotoNFT 
 * @author robertosanchez
 * @notice Contrato para la gestión de tokens ERC721 compatible con meta-transacciones ERC2771
 */
contract PhotoNFT is ERC721("V4P Photos", "Photo"), ERC2771Recipient {
    /**
     * @dev Propietario del SmartContract, utilizado para implementar el modificador onlyOwner.
     */
    address private contractOwner;
    /**
     * @dev Asociación entre tokensId y su URI
     */
    mapping(uint256 => string) private tokenURIs;

    /**
     * @dev Contador de tokens, se utiliza para obtener el siguiente ID
     */
    uint256 private tokenCounter;

    /**
     * @dev Lista de creadores de tokens permitidos, si no está en la lista no se crear un token
     */
    mapping(address owner => bool) private _mintersAllowed;

    /**
     * Evento lanzado al crear un nuevo token
     * 
     * @param owner Propietario del token
     * @param tokenId ID del token
     * @param tokenUri URI del token
     */
    event newPhotoToken(address owner, uint256 tokenId, string tokenUri);

    /**
     * Crea un nuevo contrato
     * @param trustedForwarded Dirección del contrato Forwarder para aceptar las metatransacciones.
     */
    constructor(address trustedForwarded)  {
        tokenCounter = 1;
        contractOwner = msg.sender;
        ERC2771Recipient._setTrustedForwarder(trustedForwarded);
        _mintersAllowed[contractOwner] = true;
    }

    /**
     * Retorna el ID del siguiente token que se vaya a crear
     */
    function nextTokenId() public onlyOwner view returns (uint256) {
        return tokenCounter;
    }

    /**
     * Añade un nuevo minter para habilitar la creación de tokens
     * @param minter Dirección del nuevo minter
     */
    function addMinter(address minter) public onlyOwner {
        _mintersAllowed[minter] = true;
    }

    /**
     * Deshabilita un minter para la creación de tokens
     * @param minter Dirección del minter
     */
    function removeMinter(address minter) public onlyOwner {
        _mintersAllowed[minter] = false;
    }

    /**
     * Crea un nuevo token a partir de una URI de una foto
     * @param newTokenURI URI de la foto asociada
     */
    function mintPhoto(string memory newTokenURI) external onlyAllowedMinter {
        //console.log('>>> mintPhoto');
        uint256 tokenId = tokenCounter;
        _mint(_msgSender(), tokenId);
        tokenURIs[tokenId] = newTokenURI;
        //console.log('>>> tokenId: ', tokenId);
        emit newPhotoToken(_msgSender(), tokenId, newTokenURI);
    }

    /**
     * A partir del ID del token se retorna la URI asociada
     * @param tokenId ID del token
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return tokenURIs[tokenId];
    }

    /**
     * Transfiere un token a un nuevo propietario
     * 
     * @param to Dirección con el destinatario del token
     * @param tokenId ID del token a transferir
     */
    function transferToken(address to, uint256 tokenId) external {
        //console.log('>>> transferToken');
        //console.log('>>> ownerOf(tokenId):', ownerOf(tokenId));
        //console.log('>>> _msgSender():', _msgSender());
        require(ownerOf(tokenId) == _msgSender(), "Not the owner of the token");
        _transfer(ownerOf(tokenId), to, tokenId);
    }

    /**
     * Comprueba si existe un token para el ID especificado
     * @param tokenId ID del token
     */
    function _exists(uint256 tokenId) private view returns (bool) {
        return bytes(tokenURIs[tokenId]).length > 0;
    }

    /**
     * Modificador para limitar ela ceso a ciertos métodos al propietario del contrato
     */
    modifier onlyOwner() {
        require(_msgSender() == contractOwner, "Not the owner");
        _;
    }
    
    /**
     * Modificador para limitar el acceso a ciertos métodos a propietarios permitidos
     */
    modifier onlyAllowedMinter() {
        require(_mintersAllowed[_msgSender()], "Forbidden");
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