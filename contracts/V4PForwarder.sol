// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
//import "@opengsn/contracts/src/forwarder/Forwarder.sol";

contract V4PForwarder is ERC2771Forwarder('Vote4Photo') {

    //TODO add Pausable feature of "@openzeppelin/contracts/security/Pausable.sol";
    /**
     * @notice The trustedRelayer is the contract owner
     */
    address public trustedRelayer;

    constructor() {
        trustedRelayer = msg.sender;
    }

    // function _verifySig(
    //     ForwardRequest calldata req,
    //     bytes32 domainSeparator,
    //     bytes32 requestTypeHash,
    //     bytes calldata suffixData,
    //     bytes calldata sig)
    // internal
    // override
    // view
    // {
    //     // trustedRelayer can only be called from a verified Gateway where the signatures are actually checked
    //     // note that if signature field is set, it will be verified in this Forwarder anyway
    //     if (msg.sender != trustedRelayer || sig.length != 0) {
    //         super._verifySig(req, domainSeparator, requestTypeHash, suffixData, sig);
    //     }
    // }
}