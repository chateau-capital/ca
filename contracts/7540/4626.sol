// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/extensions/IERC4626.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";

abstract contract SimpleVault is ERC20, IERC4626 {
    using SafeERC20 for IERC20;

    IERC20 private immutable _asset;

    constructor(IERC20 asset_) ERC20("Simple Vault Token", "SVT") {
        _asset = asset_;
    }

    function totalAssets() public view override returns (uint256) {
        return _asset.balanceOf(address(this));
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

    function previewDeposit(
        uint256 assets
    ) external view returns (uint256 shares) {
        revert();
    }
    function previewMint(
        uint256 shares
    ) external view override returns (uint256 assets) {
        revert();
    }

    // Implementing the `previewRedeem` function from the IERC4626 interface
    function previewRedeem(
        uint256 shares
    ) external view override returns (uint256 assets) {
        revert();
    }

    // Implementing the `previewWithdraw` function from the IERC4626 interface
    function previewWithdraw(
        uint256 assets
    ) external view override returns (uint256 shares) {
        revert();
    }

    // Implementing the `redeem` function from the IERC4626 interface
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external override returns (uint256 assets) {
        revert();
    }

    // Implementing the `withdraw` function from the IERC4626 interface
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external override returns (uint256 shares) {
        revert();
    }
    function asset() external view returns (address assetTokenAddress) {
        assetTokenAddress = address(_asset);
    }

    // Implement deposit, mint, withdraw, and redeem methods...
}
