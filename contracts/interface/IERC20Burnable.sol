// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

/// @title IERC20Burnable Interface
/// @dev Extends the IERC20 interface to include burn functionality.
/// @notice This interface adds a burn function to the standard ERC20 token interface, allowing tokens to be burned (destroyed).
interface IERC20Burnable is IERC20 {
     
    /// @notice Burns a specific amount of tokens from the caller's balance.
    /// @dev Destroys `value` tokens from the caller’s account, reducing the total supply.
    /// @param value The amount of token to be burned.
    function burn(uint256 value) external;
    function decimals() external view returns (uint8);
}
