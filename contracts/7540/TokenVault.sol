// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
// Import or define IERC7540 interfaces...
import "./4626.sol";
import "../interface/IERC7540.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/IERC20Burnable.sol";

/**
 * @title TokenVault
 * @author Tyler Fischer
 * @dev A contract for managing token deposits and redemptions.
 */
contract TokenVault is IERC7540, SimpleVault {
    /**
     * @dev Constructor to initialize the TokenVault contract.
     * @param asset_ The address of the asset token.
     * @param _paymentToken The address of the payment token.
     * @param owner The owner of the contract.
     */
    constructor(
        IERC20 asset_,
        IERC20 _paymentToken,
        address owner
    ) SimpleVault(asset_) Ownable(owner) {
        paymentToken = _paymentToken;
    }

    // State variables
    IERC20 public paymentToken;

    // Structs
    struct RedeemRecord {
        address depositor;
        address receiver;
        uint256 shares;
        uint256 status; // 1 pending 2 complete 3 canceled
    }
    struct DepositRecord {
        address depositor;
        address receiver;
        uint256 assets;
        uint256 status; // 1 pending 2 complete 3 canceled
    }

    // Mappings
    mapping(uint256 => DepositRecord) public depositRecords;
    mapping(uint256 => RedeemRecord) public redeemRecords;
    mapping(address => uint256) public userDepositRecord;
    mapping(address => uint256) public userRedeemRecord;
    uint256 private requestDepositIdCounter;
    uint256 private requestRedeemIdCounter;

    // Events
    event DepositCancelled(uint256 requestId, address depositor);
    event RedeemCancelled(uint256 requestId, address depositor);

    function _generateRequestDepositId() private returns (uint256) {
        return ++requestDepositIdCounter; // Increment and return the new value
    }
    function _generateRequestRedeemId() private returns (uint256) {
        return ++requestRedeemIdCounter; // Increment and return the new value
    }

    // External functions

    /**
     * @dev Initiates a deposit request.
     * @param assets The amount of assets to deposit.
     * @param receiver The address to receive the deposit.
     * @param owner The owner initiating the request.
     * @param data Additional data for the request.
     * @return requestId The unique ID of the deposit request.
     */
    function requestDeposit(
        uint256 assets,
        address receiver,
        address owner,
        bytes calldata data
    ) external returns (uint256 requestId) {
        require(owner == msg.sender, "Owner must be sender");
        require(assets > 0, "Assets must be greater than 0");
        require(
            paymentToken.balanceOf(msg.sender) >= assets,
            "amount is greater than user balance"
        );
        SafeERC20.safeTransferFrom(
            IERC20(paymentToken),
            msg.sender,
            address(this),
            assets
        );
        requestId = _generateRequestDepositId(); // Implement this method based on your ID strategy
        depositRecords[requestId] = DepositRecord({
            depositor: msg.sender,
            receiver: receiver,
            assets: assets, // amount of USDC provided
            status: 1
        });
        userDepositRecord[owner] = requestId;
        emit DepositRequest(receiver, owner, requestId, msg.sender, assets);

        return requestId;
    }

    /**
     * @dev Processes a deposit request.
     * @param requestId The unique ID of the deposit request.
     * @param receiver The address to receive the deposit.
     * @return shares The amount of shares issued for the deposit.
     */
    function deposit(
        uint256 requestId,
        address receiver
    ) external override onlyOwner returns (uint256 shares) {
        DepositRecord storage record = depositRecords[requestId];
        require(receiver == record.receiver, "Receiver mismatch");
        require(record.status == 1, "No pending deposit");
        shares = convertToShares(record.assets);
        _mint(receiver, shares);
        record.status = 2;
        emit DepositClaimable(receiver, requestId, record.assets, shares);
    }

    /**
     * @dev Initiates a redemption request.
     * @param shares The amount of shares to redeem.
     * @param receiver The address to receive the redemption.
     * @param owner The owner initiating the request.
     * @param data Additional data for the request.
     * @return requestId The unique ID of the redemption request.
     */
    function requestRedeem(
        uint256 shares,
        address receiver,
        address owner,
        bytes calldata data
    ) external returns (uint256 requestId) {
        require(shares > 0, "Shares must be greater than 0");
        require(this.balanceOf(msg.sender) >= shares, "Insufficient shares");
        _burn(receiver, shares);
        requestId = _generateRequestRedeemId(); // Implement this to generate a unique request ID
        redeemRecords[requestId] = RedeemRecord({
            depositor: msg.sender,
            receiver: receiver,
            shares: shares,
            status: 1
        });
        userRedeemRecord[msg.sender] = requestId;
        // Record the redeem request, similar to deposit handling
        emit RedeemRequest(receiver, owner, requestId, owner, shares);
        return requestId;
    }

    /**
     * @dev Processes a redemption request.
     * @param requestId The unique ID of the redemption request.
     */
    function redeem(uint256 requestId) external onlyOwner {
        RedeemRecord storage record = redeemRecords[requestId];
        require(record.status == 1, "No pending redeem");
        uint256 payment = convertToAssets(record.shares);
        require(
            paymentToken.balanceOf(address(this)) >= payment,
            "not enough stables in account"
        );
        SafeERC20.safeTransfer(IERC20(paymentToken), record.receiver, payment);
        record.status = 2;
        emit RedeemClaimable(
            record.depositor,
            requestId,
            payment,
            record.shares
        );
    }

    /**
     * @dev Cancels a deposit request.
     * @param requestId The unique ID of the deposit request to cancel.
     */
    function cancelDeposit(uint256 requestId) external {
        DepositRecord storage record = depositRecords[requestId];
        require(msg.sender == record.depositor, "Only depositor can cancel");
        require(record.status == 1, "Deposit not pending");
        // Refund the deposited tokens back to the depositor
        // Update the deposit record status to indicate cancellation (assuming '3' is for canceled)
        record.status = 3;
        SafeERC20.safeTransfer(
            IERC20(paymentToken),
            record.depositor,
            record.assets
        );
        emit DepositCancelled(requestId, record.depositor);
    }

    /**
     * @dev Cancels a redemption request.
     * @param requestId The unique ID of the redemption request to cancel.
     */
    function cancelRedeem(uint256 requestId) external {
        RedeemRecord storage record = redeemRecords[requestId];
        require(msg.sender == record.depositor, "Only depositor can cancel");
        require(record.status == 1, "Redeem not pending");
        _mint(record.depositor, record.shares);
        record.status = 3;
        emit RedeemCancelled(requestId, record.depositor);
    }

    // External view functions

    /**
     * @dev Retrieves the pending assets for a deposit request.
     * @param requestId The unique ID of the deposit request.
     * @param owner The owner initiating the request.
     * @return pendingAssets The amount of pending assets for the deposit request.
     */
    function pendingDepositRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 pendingAssets) {
        DepositRecord memory record = depositRecords[requestId];
        return record.assets;
    }

    /**
     * @dev Retrieves the pending shares for a redemption request.
     * @param requestId The unique ID of the redemption request.
     * @param owner The owner initiating the request.
     * @return pendingShares The amount of pending shares for the redemption request.
     */
    function pendingRedeemRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 pendingShares) {
        RedeemRecord memory record = redeemRecords[requestId];
        return record.shares;
    }

    /**
     * @dev Retrieves the claimable assets for a deposit request.
     * @param requestId The unique ID of the deposit request.
     * @param owner The owner initiating the request.
     * @return isPending The amount of claimable assets for the deposit request.
     */
    function claimableDepositRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 isPending) {
        DepositRecord memory record = depositRecords[requestId];
        require(record.assets > 0, "no deposit found");
        return record.assets;
    }

    /**
     * @dev Retrieves the claimable shares for a redemption request.
     * @param requestId The unique ID of the redemption request.
     * @param owner The owner initiating the request.
     * @return claimableShares The amount of claimable shares for the redemption request.
     */
    function claimableRedeemRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 claimableShares) {
        RedeemRecord memory record = redeemRecords[requestId];
        require(record.shares > 0, "no asset to redeem");
        return record.shares;
    }

    // these don't get used but are required in interface

    /**
     * @dev Emits that a deposit is claimable
     * @param shares The amount of shares the user has
     * @param assets The assets redeemable by the shares
     * @param owner The owner initiating the request.

     */
    function emitDepositClaimable(
        address owner,
        uint256 assets,
        uint256 shares
    ) public {
        emit DepositClaimable(owner, 0, assets, shares);
    }

    /**
     * @dev Emits that a redemption is claimable
     * @param shares The amount of shares the user has
     * @param assets The assets redeemable by the shares
     * @param owner The owner initiating the request.

     */
    function emitRedeemClaimable(
        address owner,
        uint256 assets,
        uint256 shares
    ) public {
        emit RedeemClaimable(owner, 0, assets, shares);
    }

    /**
     * @dev Previews a deposit 
     * @param assets The assets to be deposited

     */
    function previewDeposit(
        uint256 assets
    ) public view virtual override(IERC4626, SimpleVault) returns (uint256) {
        revert();
    }

    /** @dev See {IERC4626-previewMint}. */

    function previewMint(
        uint256 shares
    ) public view virtual override(IERC4626, SimpleVault) returns (uint256) {
        revert();
    }

    /** @dev See {IERC4626-withdraw}. */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override(IERC4626, SimpleVault) returns (uint256) {
        revert();
    }

    /**
     * @dev Previews a redemtion
     * @param shares The amount of shares the user has
     */
    function previewRedeem(
        uint256 shares
    ) public view virtual override(IERC4626, SimpleVault) returns (uint256) {
        revert();
    }

    /**
     * @dev Emits that a deposit is claimable
     * @param assets The assets redeemable by the shares
     */
    function previewWithdraw(
        uint256 assets
    ) public view virtual override(IERC4626, SimpleVault) returns (uint256) {
        revert();
    }
}
