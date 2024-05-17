// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title USDT Token Contract
/// @dev This contract implements a mock USDT token for testing or development purposes.
/// @notice This is a simplified version of the USDT token, mainly for use in development and testing environments.
contract USDC is ERC20 {
    /// @notice Initializes the contract with USDT token details.
    /// @dev Sets the name and symbol of the mock USDT token.
    constructor() ERC20("USDC", "USDC") {}

    /// @notice Mints USDT tokens to a specified address.
    /// @dev This function allows for the minting of USDT tokens, which increases the total supply.
    /// @param to The address that will receive the minted tokens.
    /// @param amount The amount of tokens to mint.
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
