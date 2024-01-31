// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Share is ERC20, ERC20Burnable, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {}

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

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}
