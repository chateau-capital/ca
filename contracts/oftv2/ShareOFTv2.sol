// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@layerzerolabs/lz-evm-v1-0.7/contracts/token/oft/v2/OFTV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Chateau Share Token Contract with OFTv2
/// @dev Extends OFTV2 for cross-chain functionality and adds Chateau-specific features
/// @notice This token can be transferred across different chains using LayerZero
contract ShareOFTv2 is OFTV2, Ownable {
    /// @notice Address of the vault associated with this Share token.
    address public vault;

    /// @notice Creates a new Share token instance with OFTv2 functionality.
    /// @dev Sets the token name, symbol, and transfers ownership to the contract deployer.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.
    /// @param _lzEndpoint The LayerZero endpoint address for cross-chain messaging.
    constructor(
        string memory name,
        string memory symbol,
        address _lzEndpoint
    ) OFTV2(name, symbol, _lzEndpoint) Ownable(msg.sender) {}

    /// @notice Mints Share tokens to multiple addresses.
    /// @dev Can only be called by the contract owner.
    /// @param tos Array of addresses to mint tokens to.
    /// @param amounts Array of amounts to mint to each address.
    function mint(
        address[] memory tos,
        uint256[] memory amounts
    ) public onlyOwner {
        for (uint256 i = 0; i < tos.length; ) {
            _mint(tos[i], amounts[i]);
            unchecked {
                i++;
            }
        }
    }

    /// @notice Burns a specified amount of Share tokens from an address.
    /// @dev Can only be called by the contract owner or the vault. This is enforced by the `onlyOwnerOrVault` modifier.
    /// @param from Address from which tokens will be burned.
    /// @param amount Amount of tokens to burn.
    function burn(address from, uint256 amount) public onlyOwnerOrVault {
        _burn(from, amount);
    }

    /// @notice Sets the vault address associated with this Share token.
    /// @dev Can only be called by the contract owner.
    /// @param _vault The address of the vault.
    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    /// @dev Modifier to allow only the owner or the vault to execute certain functions.
    modifier onlyOwnerOrVault() {
        require(
            msg.sender == owner() || msg.sender == vault,
            "not owner or vault"
        );
        _;
    }
} 