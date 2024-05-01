// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC4626.sol)

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
/**
 * modified 4626 template below
 * @dev Implementation of the ERC-4626 "Tokenized Vault Standard" as defined in
 * https://eips.ethereum.org/EIPS/eip-4626[ERC-4626].
 */
abstract contract SimpleVault is ERC20, IERC4626, AccessControl {
    using Math for uint256;
    bytes32 public constant PRICE_SETTER_ROLE = keccak256("PRICE_SETTER_ROLE");
    uint8 private immutable _underlyingDecimals;
    uint256 private _price;
    IERC20 internal immutable _asset;
    mapping(address => bool) public frozenAccounts;
    event AccountFrozen(address indexed account);
    event AccountUnfrozen(address indexed account);

    /**
     * @dev Set the underlying asset contract. This must be an ERC20-compatible contract (ERC-20 or ERC-777).
     */
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        _underlyingDecimals = decimals();
        _asset = asset_;
        _price = 1e18;
    }

    /**
     * @dev Decimals are computed by adding the decimal offset on top of the underlying asset's decimals. This
     * "original" value is cached during construction of the vault contract. If this read operation fails (e.g., the
     * asset has not been created yet), a default of 18 is used to represent the underlying asset's decimals.
     *
     * See {IERC20Metadata-decimals}.
     */
    function decimals()
        public
        view
        virtual
        override(IERC20Metadata, ERC20)
        returns (uint8)
    {
        return 18;
    }

    function getPrice() public view returns (uint256) {
        return _price;
    }

    // Setter for price
    function setPrice(uint256 newPrice) external onlyRole(PRICE_SETTER_ROLE) {
        require(newPrice > 0, "Price must be greater than 0");
        _price = newPrice;
    }

    /** @dev See {IERC4626-asset}. */
    function asset() public view virtual returns (address) {
        revert();
    }

    /** @dev See {IERC4626-totalAssets}. */
    function totalAssets() public view virtual returns (uint256) {
        revert();
    }

    /** @dev See {IERC4626-convertToShares}. */
    function convertToShares(
        uint256 assets
    ) public view virtual returns (uint256) {
        return _convertToShares(assets);
    }

    /** @dev See {IERC4626-convertToAssets}. */
    function convertToAssets(
        uint256 shares
    ) public view virtual returns (uint256) {
        return _convertToAssets(shares);
    }

    /** @dev See {IERC4626-maxDeposit}. */
    function maxDeposit(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /** @dev See {IERC4626-maxMint}. */
    function maxMint(address) public view virtual returns (uint256) {
        return type(uint256).max;
    }

    /** @dev See {IERC4626-maxWithdraw}. */
    function maxWithdraw(address) public view virtual returns (uint256) {
        revert();
    }

    /** @dev See {IERC4626-maxRedeem}. */
    function maxRedeem(address owner) public view virtual returns (uint256) {
        return balanceOf(owner);
    }

    /** @dev See {IERC4626-previewDeposit}. */
    function previewDeposit(
        uint256 assets
    ) public view virtual returns (uint256) {
        return _convertToShares(assets);
    }

    /** @dev See {IERC4626-previewMint}. */
    function previewMint(uint256 shares) public view virtual returns (uint256) {
        return _convertToAssets(shares);
    }

    /** @dev See {IERC4626-previewWithdraw}. */
    function previewWithdraw(
        uint256 assets
    ) public view virtual returns (uint256) {
        return _convertToShares(assets);
    }

    /** @dev See {IERC4626-previewRedeem}. */
    function previewRedeem(
        uint256 shares
    ) public view virtual returns (uint256) {
        return _convertToAssets(shares);
    }

    /** @dev See {IERC4626-mint}. */
    function mint(uint256, address) public virtual returns (uint256) {
        revert();
    }

    /** @dev See {IERC4626-withdraw}. */
    function withdraw(
        uint256,
        address,
        address
    ) public virtual returns (uint256) {
        revert();
    }

    /** @dev See {IERC4626-redeem}. */
    function redeem(
        uint256,
        address,
        address
    ) public virtual returns (uint256) {
        revert();
    }
    /**
     * @dev Internal conversion function (from assets to shares) with support for rounding direction.
     */
    function _convertToShares(
        uint256 assets
    ) public view virtual returns (uint256) {
        return ((assets * 1e30) / _price); // Adjust asset value based on price
    }

    /**
     * @dev Internal conversion function (from shares to assets) with support for rounding direction.
     */
    function _convertToAssets(
        uint256 shares
    ) public view virtual returns (uint256) {
        return (shares * _price) / 1e30; // Convert share value back to asset value based on price
    }

    /**
     * @dev Deposit/mint common workflow.
     */
    function _deposit(address, address, uint256, uint256) internal virtual {
        revert();
    }

    /**
     * @dev Withdraw/redeem common workflow.
     */
    function _withdraw(
        address,
        address,
        address,
        uint256,
        uint256
    ) internal virtual {
        revert();
    }

    function freezeAccount(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        frozenAccounts[account] = true;
        emit AccountFrozen(account);
    }

    function unfreezeAccount(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        frozenAccounts[account] = false;
        emit AccountUnfrozen(account);
    }
    function grantPriceSetter(
        address account
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PRICE_SETTER_ROLE, account);
    }

    function revokePriceSetter(
        address account
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(PRICE_SETTER_ROLE, account);
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public override(ERC20, IERC20) returns (bool) {
        require(!frozenAccounts[msg.sender], "Account is frozen");
        require(!frozenAccounts[recipient], "Recipient is frozen");
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override(ERC20, IERC20) returns (bool) {
        require(!frozenAccounts[sender], "Sender is frozen");
        require(!frozenAccounts[recipient], "Recipient is frozen");
        return super.transferFrom(sender, recipient, amount);
    }

    function addAdmin(address newAdmin) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
    }

    // Function to remove an admin
    function removeAdmin(address admin) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(DEFAULT_ADMIN_ROLE, admin);
    }
}
