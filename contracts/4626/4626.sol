// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title RWA Vault (ERC4626)
 * @dev Implementation of the ERC4626 tokenized vault standard for Real World Assets
 * 
 * This contract implements the ERC4626 standard for tokenized vaults, which standardizes
 * the representation and interaction with yield-bearing tokens. The vault allows users to:
 * - Deposit stablecoins and receive RWA shares
 * - Withdraw stablecoins by burning RWA shares
 * - Mint RWA shares by depositing stablecoins
 * - Redeem RWA shares for stablecoins
 * 
 * The vault maintains a price ratio between assets and shares that can be updated by the owner
 * to reflect the current NAV of the underlying RWA assets.
 */
contract RWA4626Vault is ERC20, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // ============ Events ============

    /**
     * @dev Emitted when assets are deposited into the vault
     * @param caller The address that initiated the deposit
     * @param owner The address that owns the shares
     * @param assets The amount of assets deposited
     * @param shares The amount of shares minted
     */
    event Deposit(
        address indexed caller,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when assets are withdrawn from the vault
     * @param caller The address that initiated the withdrawal
     * @param receiver The address that receives the assets
     * @param owner The address that owns the shares
     * @param assets The amount of assets withdrawn
     * @param shares The amount of shares burned
     */
    event Withdraw(
        address indexed caller,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when shares are minted
     * @param caller The address that initiated the mint
     * @param receiver The address that receives the shares
     * @param assets The amount of assets deposited
     * @param shares The amount of shares minted
     */
    event Mint(
        address indexed caller,
        address indexed receiver,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when shares are redeemed
     * @param caller The address that initiated the redeem
     * @param receiver The address that receives the assets
     * @param owner The address that owns the shares
     * @param assets The amount of assets withdrawn
     * @param shares The amount of shares burned
     */
    event Redeem(
        address indexed caller,
        address indexed receiver,
        address indexed owner,
        uint256 assets,
        uint256 shares
    );

    /**
     * @dev Emitted when the price is updated
     * @param user The address that updated the price
     * @param price The new price
     */
    event UpdatePrice(address indexed user, uint256 price);

    /**
     * @dev Emitted when the admin withdraws assets from the vault
     * @param user The address that withdrew the assets
     * @param withdraw The amount of assets withdrawn
     */
    event AdminWithdraw(address indexed user, uint256 withdraw);

    // ============ State Variables ============

    /// @dev The underlying asset token (stablecoin)
    IERC20 public immutable asset;

    /// @dev The decimals of the underlying asset
    uint8 private immutable _decimals;

    /// @dev The total amount of assets in the vault
    uint256 private _totalAssets;

    /// @dev The fee numerator (in basis points, 1 = 0.01%)
    uint256 public feeNumerator;

    /// @dev The fee denominator (10000 = 100%)
    uint256 public constant FEE_DENOMINATOR = 10000;

    /// @dev The price of the RWA token in terms of the underlying asset (with 6 decimals)
    uint256 public price = 1e6;

    /// @dev Minimum deposit amount (in asset decimals)
    uint256 public minDeposit;

    /// @dev Struct to track a user's staking details
    struct Stake {
        /// The user's address
        address user;
        /// Amount staked
        uint256 amount;
        /// Timestamp of when the stake was made
        uint256 timestamp;
        /// Whether the stake is currently active
        bool isStaking;
    }

    /// @dev Mapping of stakes by an index
    mapping(uint256 => Stake) public stakes;

    /// @dev Mapping of user addresses to their stake indexes
    mapping(address => uint256[]) public userStakeIndex;

    /// @dev End index for tracking stakes
    uint256 public indexEnd;

    /// @dev Start index for managing unstaking
    uint256 public indexStart;

    /// @dev Total amount pending for liquidation
    uint256 public pendingLiquidation;

    // ============ Constructor ============

    /**
     * @dev Constructor that initializes the vault with the underlying asset
     * @param _asset The address of the underlying asset token (stablecoin)
     * @param name_ The name of the share token
     * @param symbol_ The symbol of the share token
     * @param _minDeposit The minimum deposit amount
     */
    constructor(
        IERC20 _asset,
        string memory name_,
        string memory symbol_,
        uint256 _minDeposit
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        asset = _asset;
        _decimals = IERC20Metadata(address(_asset)).decimals();
        minDeposit = _minDeposit;
        indexEnd++;
    }

    // ============ External Functions ============

    /**
     * @dev Deposits assets into the vault and mints shares to the caller
     * @param assets The amount of assets to deposit
     * @param receiver The address that will receive the shares
     * @return shares The amount of shares minted
     */
    function deposit(
        uint256 assets,
        address receiver
    ) external nonReentrant whenNotPaused returns (uint256 shares) {
        require(assets >= minDeposit, "Amount below minimum deposit");
        
        shares = previewDeposit(assets);

        // Transfer assets from caller to vault
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // Update total assets
        _totalAssets += assets;

        // Record the stake
        stakes[indexEnd] = Stake(receiver, assets, block.timestamp, true);
        userStakeIndex[receiver].push(indexEnd);
        indexEnd++;

        // Update pending liquidation
        pendingLiquidation += assets;

        // Mint shares to receiver
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, assets, shares);
    }

    /**
     * @dev Withdraws assets from the vault by burning shares
     * @param assets The amount of assets to withdraw
     * @param receiver The address that will receive the assets
     * @param owner The address that owns the shares
     * @return shares The amount of shares burned
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external nonReentrant whenNotPaused returns (uint256 shares) {
        shares = previewWithdraw(assets);

        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }

        // Burn shares from owner
        _burn(owner, shares);

        // Update total assets
        _totalAssets -= assets;

        // Update pending liquidation
        pendingLiquidation -= assets;

        // Transfer assets to receiver
        asset.safeTransfer(receiver, assets);

        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }

    /**
     * @dev Mints shares by depositing assets
     * @param shares The amount of shares to mint
     * @param receiver The address that will receive the shares
     * @return assets The amount of assets deposited
     */
    function mint(
        uint256 shares,
        address receiver
    ) external nonReentrant whenNotPaused returns (uint256 assets) {
        assets = previewMint(shares);
        
        require(assets >= minDeposit, "Amount below minimum deposit");

        // Transfer assets from caller to vault
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // Update total assets
        _totalAssets += assets;

        // Record the stake
        stakes[indexEnd] = Stake(receiver, assets, block.timestamp, true);
        userStakeIndex[receiver].push(indexEnd);
        indexEnd++;

        // Update pending liquidation
        pendingLiquidation += assets;

        // Mint shares to receiver
        _mint(receiver, shares);

        emit Mint(msg.sender, receiver, assets, shares);
    }

    /**
     * @dev Redeems shares for assets
     * @param shares The amount of shares to redeem
     * @param receiver The address that will receive the assets
     * @param owner The address that owns the shares
     * @return assets The amount of assets withdrawn
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external nonReentrant whenNotPaused returns (uint256 assets) {
        assets = previewRedeem(shares);

        if (msg.sender != owner) {
            _spendAllowance(owner, msg.sender, shares);
        }

        // Burn shares from owner
        _burn(owner, shares);

        // Update total assets
        _totalAssets -= assets;

        // Update pending liquidation
        pendingLiquidation -= assets;

        // Transfer assets to receiver
        asset.safeTransfer(receiver, assets);

        emit Redeem(msg.sender, receiver, owner, assets, shares);
    }

    /**
     * @dev Allows users to unstake their assets
     * @return unstakeAmount The amount of assets unstaked
     */
    function unstake() external nonReentrant whenNotPaused returns (uint256 unstakeAmount) {
        uint256[] memory userStakeIndexes = userStakeIndex[msg.sender];

        for (uint256 i = 0; i < userStakeIndexes.length; i++) {
            uint256 index = userStakeIndexes[i];
            if (index >= indexStart) {
                Stake storage stakeInfo = stakes[index];
                if (stakeInfo.isStaking) {
                    unstakeAmount += stakeInfo.amount;
                    stakeInfo.isStaking = false;
                }
            }
        }

        if (unstakeAmount > 0) {
            // Calculate shares to burn based on the current price
            uint256 sharesToBurn = _convertToShares(unstakeAmount, Math.Rounding.Up);
            
            // Burn shares from owner
            _burn(msg.sender, sharesToBurn);
            
            // Update total assets
            _totalAssets -= unstakeAmount;
            
            // Update pending liquidation
            pendingLiquidation -= unstakeAmount;
            
            // Transfer assets to receiver
            asset.safeTransfer(msg.sender, unstakeAmount);
            
            emit Withdraw(msg.sender, msg.sender, msg.sender, unstakeAmount, sharesToBurn);
        }
    }

    /**
     * @dev Queries valid subscription information for the user's current turn
     * @param user User address to query subscription info for
     * @return Array of Stake structs representing the user's staking info
     */
    function getStakingInfo(address user) public view returns (Stake[] memory) {
        require(user != address(0), "Invalid address");
        uint256[] memory userStakeIndexes = userStakeIndex[user];

        uint256 key;
        for (uint256 i = 0; i < userStakeIndexes.length; i++) {
            uint256 index = userStakeIndexes[i];
            Stake memory stakeInfo = stakes[index];

            if (index >= indexStart && stakeInfo.isStaking) key++;
        }

        Stake[] memory userStakes = new Stake[](key);

        uint256 key2;
        for (uint256 i = 0; i < userStakeIndexes.length; i++) {
            uint256 index = userStakeIndexes[i];
            Stake memory stakeInfo = stakes[index];

            if (index >= indexStart && stakeInfo.isStaking) {
                userStakes[key2] = stakeInfo;
                key2++;
            }
        }

        return userStakes;
    }

    // ============ View Functions ============

    /**
     * @dev Returns the total amount of assets in the vault
     * @return The total amount of assets
     */
    function totalAssets() external view returns (uint256) {
        return _totalAssets;
    }

    /**
     * @dev Returns the total amount of shares issued
     * @return The total amount of shares
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply();
    }

    /**
     * @dev Returns the amount of assets that would be deposited for a given amount of shares
     * @param assets The amount of assets to deposit
     * @return The amount of shares that would be minted
     */
    function previewDeposit(uint256 assets) public view returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Down);
    }

    /**
     * @dev Returns the amount of shares that would be burned for a given amount of assets
     * @param assets The amount of assets to withdraw
     * @return The amount of shares that would be burned
     */
    function previewWithdraw(uint256 assets) public view returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Up);
    }

    /**
     * @dev Returns the amount of assets that would be deposited for a given amount of shares
     * @param shares The amount of shares to mint
     * @return The amount of assets that would be deposited
     */
    function previewMint(uint256 shares) public view returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Up);
    }

    /**
     * @dev Returns the amount of assets that would be withdrawn for a given amount of shares
     * @param shares The amount of shares to redeem
     * @return The amount of assets that would be withdrawn
     */
    function previewRedeem(uint256 shares) public view returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Down);
    }

    /**
     * @dev Returns the maximum amount of assets that can be deposited
     * @return The maximum amount of assets
     */
    function maxDeposit(address) external view returns (uint256) {
        return type(uint256).max;
    }

    /**
     * @dev Returns the maximum amount of shares that can be minted
     * @return The maximum amount of shares
     */
    function maxMint(address) external view returns (uint256) {
        return type(uint256).max;
    }

    /**
     * @dev Returns the maximum amount of assets that can be withdrawn
     * @return The maximum amount of assets
     */
    function maxWithdraw(address owner) external view returns (uint256) {
        return _convertToAssets(balanceOf(owner), Math.Rounding.Down);
    }

    /**
     * @dev Returns the maximum amount of shares that can be redeemed
     * @return The maximum amount of shares
     */
    function maxRedeem(address owner) external view returns (uint256) {
        return balanceOf(owner);
    }

    /**
     * @dev Returns the decimals of the share token
     * @return The decimals of the share token
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    // ============ Internal Functions ============

    /**
     * @dev Converts assets to shares
     * @param assets The amount of assets
     * @param rounding The rounding mode
     * @return The amount of shares
     */
    function _convertToShares(
        uint256 assets,
        Math.Rounding rounding
    ) internal view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return assets;
        }
        
        // Apply price ratio for RWA assets
        uint256 adjustedAssets = (assets * price) / 1e6;
        return adjustedAssets.mulDiv(supply, _totalAssets, rounding);
    }

    /**
     * @dev Converts shares to assets
     * @param shares The amount of shares
     * @param rounding The rounding mode
     * @return The amount of assets
     */
    function _convertToAssets(
        uint256 shares,
        Math.Rounding rounding
    ) internal view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) {
            return shares;
        }
        
        // Calculate assets based on shares and price ratio
        uint256 assets = shares.mulDiv(_totalAssets, supply, rounding);
        return (assets * 1e6) / price;
    }

    // ============ Admin Functions ============

    /**
     * @dev Sets the fee numerator
     * @param _feeNumerator The new fee numerator
     */
    function setFeeNumerator(uint256 _feeNumerator) external onlyOwner {
        require(_feeNumerator <= FEE_DENOMINATOR, "Fee too high");
        feeNumerator = _feeNumerator;
    }

    /**
     * @dev Sets the minimum deposit amount
     * @param _minDeposit The new minimum deposit amount
     */
    function setMinDeposit(uint256 _minDeposit) external onlyOwner {
        minDeposit = _minDeposit;
    }

    /**
     * @dev Updates the price of the RWA token
     * @param _newPrice The new price
     */
    function updatePrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
        emit UpdatePrice(msg.sender, price);
    }

    /**
     * @dev Pauses the vault
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraws assets from the vault (admin only)
     * @param assets The amount of assets to withdraw
     * @param receiver The address that will receive the assets
     */
    function adminWithdraw(
        uint256 assets,
        address receiver
    ) external onlyOwner {
        require(assets <= _totalAssets, "Insufficient assets");
        _totalAssets -= assets;
        pendingLiquidation = 0;
        indexStart = indexEnd;
        asset.safeTransfer(receiver, assets);
        emit AdminWithdraw(msg.sender, assets);
    }
} 