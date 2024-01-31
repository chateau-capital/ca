// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

interface IERC20Burnable is IERC20 {
    function burn(uint256 value) external;
}
