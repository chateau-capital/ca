// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@quadrata/contracts/interfaces/IQuadReader.sol";
import "@quadrata/contracts/interfaces/IQuadPassportStore.sol";
import "@quadrata/contracts/utility/QuadReaderUtils.sol";

contract NotAmerica {
    using QuadReaderUtils for bytes32;
    IQuadReader public reader;
    constructor() {
        reader = IQuadReader(0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da); // Arbitrum One
    }

    modifier NOT_AMERICAN() {
        _;
        return;
        IQuadPassportStore.Attribute[] memory attributes = reader.getAttributes(
            msg.sender,
            keccak256("COUNTRY")
        );

        require(attributes.length > 0, "REQUIRES_COUNTRY");

        // only users residing outside the US may borrow money
        require(!attributes[0].value.countryIsEqual("US"), "AMERICAN");
        _;
    }
}
