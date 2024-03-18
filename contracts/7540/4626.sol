// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC4626.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";

contract SimpleVault is ERC20, IERC4626 {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;

    constructor(IERC20 _asset) ERC20("Simple Vault Token", "SVT") {
        asset = _asset;
    }

    function totalAssets() public view override returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function convertToShares(
        uint256 assets
    ) public view override returns (uint256) {
        // Simplified conversion, assumes 1:1 ratio for assets to shares.
        return assets;
    }

    function convertToAssets(
        uint256 shares
    ) public view override returns (uint256) {
        // Simplified conversion, assumes 1:1 ratio for shares to assets.
        return shares;
    }

    function maxDeposit(address) public view override returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) public view override returns (uint256) {
        return type(uint256).max;
    }

    function maxWithdraw(address owner) public view override returns (uint256) {
        return balanceOf(owner);
    }

    function maxRedeem(address owner) public view override returns (uint256) {
        return balanceOf(owner);
    }

    // Implement deposit, mint, withdraw, and redeem methods...
}
