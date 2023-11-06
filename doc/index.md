# Solidity API

## PhotoNFT

### newPhotoToken

```solidity
event newPhotoToken(address owner, uint256 tokenId, string tokenUri)
```

Evento lanzado al crear un nuevo token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | Propietario del token |
| tokenId | uint256 | ID del token |
| tokenUri | string | URI del token |

### constructor

```solidity
constructor(address trustedForwarded) public
```

Crea un nuevo contrato

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| trustedForwarded | address | Dirección del contrato Forwarder para aceptar las metatransacciones. |

### nextTokenId

```solidity
function nextTokenId() public view returns (uint256)
```

Retorna el ID del siguiente token que se vaya a crear

### addMinter

```solidity
function addMinter(address minter) public
```

Añade un nuevo minter para habilitar la creación de tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | Dirección del nuevo minter |

### removeMinter

```solidity
function removeMinter(address minter) public
```

Deshabilita un minter para la creación de tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| minter | address | Dirección del minter |

### mintPhoto

```solidity
function mintPhoto(string newTokenURI) external
```

Crea un nuevo token a partir de una URI de una foto

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newTokenURI | string | URI de la foto asociada |

### tokenURI

```solidity
function tokenURI(uint256 tokenId) public view returns (string)
```

A partir del ID del token se retorna la URI asociada

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | ID del token |

### transferToken

```solidity
function transferToken(address to, uint256 tokenId) external
```

Transfiere un token a un nuevo propietario

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | Dirección con el destinatario del token |
| tokenId | uint256 | ID del token a transferir |

### onlyOwner

```solidity
modifier onlyOwner()
```

Modificador para limitar ela ceso a ciertos métodos al propietario del contrato

### onlyAllowedMinter

```solidity
modifier onlyAllowedMinter()
```

Modificador para limitar el acceso a ciertos métodos a propietarios permitidos

### _msgSender

```solidity
function _msgSender() internal view virtual returns (address ret)
```

### _msgData

```solidity
function _msgData() internal view virtual returns (bytes ret)
```

## V4PForwarder

### trustedRelayer

```solidity
address trustedRelayer
```

The trustedRelayer is the contract owner

### constructor

```solidity
constructor() public
```

## Lock

### unlockTime

```solidity
uint256 unlockTime
```

### owner

```solidity
address payable owner
```

### Withdrawal

```solidity
event Withdrawal(uint256 amount, uint256 when)
```

### constructor

```solidity
constructor(uint256 _unlockTime) public payable
```

### withdraw

```solidity
function withdraw() public
```

