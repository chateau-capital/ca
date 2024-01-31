// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Share is ERC20, ERC20Burnable, Ownable {
    address public vault;

    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

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

    function burn(address from, uint256 amount) public onlyOwnerOrVault {
        _burn(from, amount);
    }

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    modifier onlyOwnerOrVault() {
        require(
            msg.sender == owner() || msg.sender == vault,
            "not owner or vault"
        );
        _;
    }
}
