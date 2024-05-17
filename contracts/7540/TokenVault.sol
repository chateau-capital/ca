// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
// Import or define IERC7540 interfaces...
import "./4626.sol";
import "../interface/IERC7540.sol";
import "../interface/IERC20Burnable.sol";
import "../utils/NotAmerica.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
enum RECORD_STATUS {
    UNKNOWN,
    PENDING,
    COMPLETE,
    CANCELED
}
struct RedeemRecord {
    address depositor;
    address receiver;
    uint256 shares;
    RECORD_STATUS status;
}
struct DepositRecord {
    address depositor;
    address receiver;
    uint256 assets;
    RECORD_STATUS status;
}
/**
 * @title TokenVault
 * @author Tyler Fischer
 * @dev A contract for managing token deposits and redemptions.
 */
contract TokenVault is IERC7540, SimpleVault, NotAmerica, Pausable {
    /**
     * @dev Constructor to initialize the TokenVault contract.
     * @param _paymentToken The address of the payment token.
     * @param _owner The owner of the contract.
     * @param _name The name of the token
     * @param _symbol The symbol of the token.
     */
    constructor(
        IERC20 _paymentToken,
        address _owner,
        address _depositAddress,
        address _priceControllerAddress,
        string memory _name,
        string memory _symbol
    ) SimpleVault(_asset, _name, _symbol) {
        paymentToken = _paymentToken;
        depositAddress = _depositAddress;
        _grantRole(PRICE_SETTER_ROLE, _priceControllerAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
    }

    IERC20 public paymentToken;
    address public depositAddress;
    uint256 private requestDepositIdCounter;
    uint256 private requestRedeemIdCounter;
    uint256 public fee = 1; //increment by .1% so 25 == 2.5% 1 == .1%
    mapping(uint256 => DepositRecord) public depositRecords;
    mapping(uint256 => RedeemRecord) public redeemRecords;
    mapping(address => uint256) public userDepositRecord;
    mapping(address => uint256) public userRedeemRecord;
    event DepositCancelled(uint256 requestId, address depositor);
    event RedeemCancelled(uint256 requestId, address depositor);

    function _generateRequestDepositId() private returns (uint256) {
        return ++requestDepositIdCounter;
    }

    function _generateRequestRedeemId() private returns (uint256) {
        return ++requestRedeemIdCounter;
    }

    /**
     * @dev Initiates a deposit request.
     * @param assets The amount of assets to deposit.
     * @param receiver The address to receive the deposit.
     * @return requestId The unique ID of the deposit request.
     */
    function requestDeposit(
        uint256 assets,
        address receiver,
        address,
        bytes calldata
    ) external whenNotPaused NOT_AMERICAN returns (uint256 requestId) {
        require(assets > 0, "Assets must be greater than 0");
        require(
            paymentToken.balanceOf(msg.sender) >= assets,
            "Amount is greater than user balance"
        );
        requestId = userDepositRecord[msg.sender];
        DepositRecord storage record = depositRecords[requestId];
        if (requestId != 0 && record.status == RECORD_STATUS.PENDING) {
            return requestId; // Return existing pending deposit ID
        } else {
            SafeERC20.safeTransferFrom(
                IERC20(paymentToken),
                msg.sender,
                address(this),
                assets
            );
            requestId = _generateRequestDepositId();
            depositRecords[requestId] = DepositRecord({
                depositor: msg.sender,
                receiver: receiver,
                assets: assets, // amount of USDC provided
                status: RECORD_STATUS.PENDING
            });
            userDepositRecord[msg.sender] = requestId;
            emit DepositRequest(
                receiver,
                msg.sender,
                requestId,
                msg.sender,
                assets
            );
            return requestId;
        }
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
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 shares) {
        DepositRecord storage record = depositRecords[requestId];
        require(receiver == record.receiver, "Receiver mismatch");
        require(record.status == RECORD_STATUS.PENDING, "No pending deposit");
        require(
            paymentToken.balanceOf(address(this)) >= record.assets,
            "Amount is greater than user balance"
        );
        shares = convertToShares(record.assets - getPercentage(record.assets));
        _mint(receiver, shares);
        record.status = RECORD_STATUS.COMPLETE;
        paymentToken.approve(address(this), record.assets);
        SafeERC20.safeTransferFrom(
            IERC20(paymentToken),
            address(this),
            depositAddress,
            record.assets
        );
        emit DepositClaimable(
            record.depositor,
            requestId,
            record.assets,
            shares
        );
    }

    /**
     * @dev Initiates a redemption request.
     * @param shares The amount of shares to redeem.
     * @param receiver The address to receive the redemption.
     * @return requestId The unique ID of the redemption request.
     */
    function requestRedeem(
        uint256 shares,
        address receiver,
        address,
        bytes calldata
    ) external whenNotPaused NOT_AMERICAN returns (uint256 requestId) {
        require(shares > 0, "Shares must be greater than 0");
        require(this.balanceOf(msg.sender) >= shares, "Insufficient shares");
        RedeemRecord storage record = redeemRecords[requestId];
        if (requestId != 0 && record.status == RECORD_STATUS.PENDING) {
            return requestId;
        } else {
            _burn(msg.sender, shares);
            requestId = _generateRequestRedeemId(); // Implement this to generate a unique request ID
            redeemRecords[requestId] = RedeemRecord({
                depositor: msg.sender,
                receiver: receiver,
                shares: shares,
                status: RECORD_STATUS.PENDING
            });
            userRedeemRecord[msg.sender] = requestId;
            // Record the redeem request, similar to deposit handling
            emit RedeemRequest(
                receiver,
                msg.sender,
                requestId,
                msg.sender,
                shares
            );
            return requestId;
        }
    }

    /**
     * @dev Processes a redemption request.
     * @param requestId The unique ID of the redemption request.
     */
    function redeem(uint256 requestId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        RedeemRecord storage record = redeemRecords[requestId];
        require(record.status == RECORD_STATUS.PENDING, "No pending redeem");
        uint256 payment = convertToAssets(record.shares);
        require(
            paymentToken.balanceOf(address(this)) >= payment,
            "not enough stables in account"
        );
        SafeERC20.safeTransfer(IERC20(paymentToken), record.receiver, payment);
        record.status = RECORD_STATUS.COMPLETE;
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
    function cancelDeposit(uint256 requestId) external whenNotPaused {
        DepositRecord storage record = depositRecords[requestId];
        require(msg.sender == record.depositor, "Only depositor can cancel");
        require(record.status == RECORD_STATUS.PENDING, "Deposit not pending");
        require(
            paymentToken.balanceOf(address(this)) >= record.assets,
            "No funds currently in contract"
        );
        // Refund the deposited tokens back to the depositor
        // Update the deposit record status to indicate cancellation (assuming '3' is for canceled)
        record.status = RECORD_STATUS.CANCELED;
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
    function cancelRedeem(uint256 requestId) external whenNotPaused {
        RedeemRecord storage record = redeemRecords[requestId];
        require(msg.sender == record.depositor, "Only depositor can cancel");
        require(record.status == RECORD_STATUS.PENDING, "Redeem not pending");
        _mint(record.depositor, record.shares);
        record.status = RECORD_STATUS.CANCELED;
        emit RedeemCancelled(requestId, record.depositor);
    }

    /**
     * @dev Retrieves the pending assets for a deposit request.
     * @param requestId The unique ID of the deposit request.
     * @return pendingAssets The amount of pending assets for the deposit request.
     */
    function pendingDepositRequest(
        uint256 requestId,
        address
    ) external view returns (uint256 pendingAssets) {
        DepositRecord memory record = depositRecords[requestId];
        return record.assets;
    }

    /**
     * @dev Retrieves the pending shares for a redemption request.
     * @param requestId The unique ID of the redemption request.
     * @return pendingShares The amount of pending shares for the redemption request.
     */
    function pendingRedeemRequest(
        uint256 requestId,
        address
    ) external view returns (uint256 pendingShares) {
        RedeemRecord memory record = redeemRecords[requestId];
        return record.shares;
    }

    /**
     * @dev Retrieves the claimable assets for a deposit request.
     * @param requestId The unique ID of the deposit request.
     * @return isPending The amount of claimable assets for the deposit request.
     */
    function claimableDepositRequest(
        uint256 requestId,
        address
    ) external view returns (uint256 isPending) {
        DepositRecord memory record = depositRecords[requestId];
        require(record.assets > 0, "no deposit found");
        return record.assets;
    }

    /**
     * @dev Retrieves the claimable shares for a redemption request.
     * @param requestId The unique ID of the redemption request.
     * @return claimableShares The amount of claimable shares for the redemption request.
     */
    function claimableRedeemRequest(
        uint256 requestId,
        address
    ) external view returns (uint256 claimableShares) {
        RedeemRecord memory record = redeemRecords[requestId];
        require(record.shares > 0, "no asset to redeem");
        return record.shares;
    }
    /**
     * @dev Pauses all activities that can be paused by changing the state to paused. This is a security feature
     * in case of an emergency requiring a halt in operations. Only accessible by an admin role.
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpauses the contract allowing normal operations to resume, reversing the effect of the pause() function.
     * Only accessible by an admin role.
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Sets the fee percentage for transactions within the vault. The fee is denoted in tenths of a percent.
     * @param _fee The new fee percentage to set. Must be a non-negative value and cannot exceed 1000 (which represents 100%).
     */
    function setFee(uint256 _fee) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_fee >= 0, "Fee must be non-negative");
        fee = _fee;
    }

    /**
     * @dev Sets the address where deposited assets should be transferred. This is likely an operational or treasury account.
     * @param _deposiAddress The new address to which assets are transferred upon deposits.
     */
    function setDepositAddress(
        address _deposiAddress
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        depositAddress = _deposiAddress;
    }

    /**
     * @dev Calculates the fee to be deducted from a transaction based on the fee percentage and the amount involved.
     * @param value The amount on which the fee is to be calculated.
     * @return The calculated fee amount.
     */
    function getPercentage(uint256 value) public view returns (uint256) {
        require(fee <= 1000, "Fee percentage cannot exceed 100%");
        return (value * fee) / 1000; // Calculate fee as a fraction of 1000 (i.e., 1000 is 100%, 1 is 0.1%).
    }
}
