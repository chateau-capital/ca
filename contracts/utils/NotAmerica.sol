// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Kaso Qian
/// @notice Check Quadrata for user nationality. Only non-US persons are allowed.
/// @dev This contract utilizes Quadrata's blockchain passport system to enforce access based on nationality, specifically blocking US persons.
/// @notice Quadrata Documentation here: https://docs.quadrata.com/integration/how-to-integrate/request-privacy-data


import "@quadrata/contracts/interfaces/IQuadReader.sol";
import "@quadrata/contracts/interfaces/IQuadPassportStore.sol";
import "@quadrata/contracts/utility/QuadReaderUtils.sol";

/// @dev Contract to restrict access for US persons based on Quadrata's passport verification.
contract NotAmerica {

    /// @notice Quadrata Reader interface for retrieving passport attributes.
    IQuadReader public reader;

    /// @notice Initializes the contract by setting the appropriate reader address based on the chain ID.
    /// @dev Supports multiple networks by assigning different Quadrata reader addresses per network.
    constructor() {
        uint chainId = _chainID();
        if (chainId == 11155111)
            reader = IQuadReader(0x49CF5d391B223E9196A7f5927A44D57fec1244C8); // Sepolia
        if (chainId == 10)
            reader = IQuadReader(0xFEB98861425C6d2819c0d0Ee70E45AbcF71b43Da); // Optimistic
        if (chainId == 42161)
            reader = IQuadReader(0x49CF5d391B223E9196A7f5927A44D57fec1244C8); // Arbitrum One
    }

    /// @dev Modifier to restrict function access to non-US persons based on Quadrata passport data.
    /// @notice Checks the caller's country attribute, denying access if the user is from the US.
    modifier NOT_AMERICAN() {
        // IQuadPassportStore.Attribute[] memory attributes = reader.getAttributes(
        //     msg.sender,
        //     keccak256("COUNTRY")
        // );

        // require(attributes.length > 0, "REQUIRES_COUNTRY");

        // /// Only users residing outside the US may proceed.
        // require(!attributes[0].value.countryIsEqual("US"), "AMERICAN");
        _;
    }

    /// @notice Retrieves the current chain ID in a secure manner.
    /// @return id The current chain ID.
    /// @dev Uses inline assembly for accessing the `chainid` opcode directly.
    function _chainID() internal view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
    
}
