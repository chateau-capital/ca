// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@layerzerolabs/lz-evm-v1-0.7/contracts/token/oft/v2/OFTV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title USDC Token Contract with OFTv2
/// @dev Extends OFTV2 for cross-chain functionality
/// @notice This token can be transferred across different chains using LayerZero
contract USDCOFTv2 is OFTV2, Ownable {
    /// @notice Creates a new USDC token instance with OFTv2 functionality.
    /// @dev Sets the token name, symbol, and transfers ownership to the contract deployer.
    /// @param _lzEndpoint The LayerZero endpoint address for cross-chain messaging.
    constructor(
        address _lzEndpoint
    ) OFTV2("USD Coin", "USDC", _lzEndpoint) Ownable(msg.sender) {}

    /// @notice Mints USDC tokens to a specified address.
    /// @dev Can only be called by the contract owner.
    /// @param to The address that will receive the minted tokens.
    /// @param amount The amount of tokens to mint.
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /// @notice Override the decimals function to return 6 decimals for USDC.
    /// @dev USDC uses 6 decimals instead of the standard 18.
    /// @return The number of decimals for the token.
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
} 