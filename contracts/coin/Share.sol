// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CHΛTΞΛU: DeFi meets Private Capital Markets
/// @author Kasoqian
/// @notice You can use this contract for only the most basic simulation
/// @dev All function calls are currently implemented without side effects
/// @custom: 

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Chateau Share Token Contract
/// @dev Extends ERC20 and ERC20Burnable for a burnable token with additional functionality specific to the Chateau protocol
contract Share is ERC20, ERC20Burnable, Ownable {

    /// @notice Address of the vault associated with this Share token.
    address public vault;

    /// @notice Creates a new Share token instance.
    /// @dev Sets the token name, symbol, and transfers ownership to the contract deployer.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}


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
