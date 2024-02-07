// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@quadrata/contracts/interfaces/IQuadReader.sol";
import "@quadrata/contracts/interfaces/IQuadPassportStore.sol";
import "@quadrata/contracts/utility/QuadReaderUtils.sol";

contract NotAmerica {
    using QuadReaderUtils for bytes32;
    IQuadReader public reader;

    constructor() {
        uint chainId = _chainID();
        if (chainId == 11155111)
            reader = IQuadReader(0x49CF5d391B223E9196A7f5927A44D57fec1244C8); // Sepolia
        if (chainId == 10)
            reader = IQuadReader(0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da); // Optimistic
        if (chainId == 42161)
            reader = IQuadReader(0x49CF5d391B223E9196A7f5927A44D57fec1244C8); // Arbitrum One
    }

    modifier NOT_AMERICAN() {
        IQuadPassportStore.Attribute[] memory attributes = reader.getAttributes(
            msg.sender,
            keccak256("COUNTRY")
        );

        require(attributes.length > 0, "REQUIRES_COUNTRY");

        // only users residing outside the US may borrow money
        require(!attributes[0].value.countryIsEqual("US"), "AMERICAN");
        _;
    }

    function _chainID() internal view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}
