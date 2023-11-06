// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import "hardhat/console.sol";

contract V4PForwarder is ERC2771Forwarder('Vote4Photo') {

    /**
     * @notice The unique trustedRelayer is the contract owner
     */
    address public trustedRelayer;

    constructor() {
        trustedRelayer = msg.sender;
    }

    /// @inheritdoc ERC2771Forwarder
    function _validate(
        ForwardRequestData calldata request
    ) override internal view virtual returns (bool isTrustedForwarder, bool active, bool signerMatch, address signer) {
        require(msg.sender == trustedRelayer, "Unknown relayer");
        return super._validate(request);
    }
}