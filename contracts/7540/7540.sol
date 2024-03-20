// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
// Import or define IERC7540 interfaces...
import "./4626.sol";
import "../interface/IERC7540.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract Vault is IERC7540, SimpleVault, Ownable {
    constructor(
        IERC20 _asset,
        IERC20 _paymentToken,
        address owner
    ) SimpleVault(_asset) Ownable(owner) {
        paymentToken = _paymentToken;
    }
    IERC20 public paymentToken;
    struct RedeemRecord {
        address depositor;
        address receiver;
        uint256 assets;
        bool completed;
    }
    struct DepositRecord {
        address depositor;
        address receiver;
        uint256 assets;
        bool completed;
    }
    mapping(uint256 => DepositRecord) public depositRecords;
    mapping(uint256 => RedeemRecord) public redeemRecords;
    mapping(address => uint256) public userDepositRecord;
    mapping(address => uint256) public userRedeemRecord;
    uint256 private requestDepositIdCounter;
    uint256 private requestRedeemIdCounter;
    function _generateRequestDepositId() private returns (uint256) {
        return ++requestDepositIdCounter; // Increment and return the new value
    }
    function _generateRequestRedeemId() private returns (uint256) {
        return ++requestRedeemIdCounter; // Increment and return the new value
    }
    // Define mappings to track deposit and redeem requests...
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
            receiver,
            assets
        );
        requestId = _generateRequestDepositId(); // Implement this method based on your ID strategy
        depositRecords[requestId] = DepositRecord({
            depositor: owner,
            receiver: receiver,
            assets: assets,
            completed: false
        });
        userDepositRecord[owner] = requestId;
        emit DepositRequest(receiver, owner, requestId, owner, assets);

        return requestId;
    }

    function deposit(
        uint256 requestId,
        address receiver
    ) external onlyOwner returns (uint256 shares) {
        DepositRecord storage record = depositRecords[requestId];
        require(receiver == record.receiver);
        require(!record.completed, "Deposit already processed");
        shares = convertToShares(record.assets);
        _mint(record.receiver, shares);
        record.completed = true;
        // emit SharesIssued(requestId, record.receiver, shares);
    }

    function mint(
        uint256 shares,
        address receiver
    ) external onlyOwner returns (uint256 assets) {
        _mint(receiver, shares);
    }

    function requestRedeem(
        uint256 shares,
        address receiver,
        address owner,
        bytes calldata data
    ) external returns (uint256 requestId) {
        require(shares > 0, "Shares must be greater than 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        // Logic to reduce shares from the sender
        _burn(msg.sender, shares); // Adjust based on your shares handling logic
        requestId = _generateRequestRedeemId(); // Implement this to generate a unique request ID
        redeemRecords[requestId] = RedeemRecord({
            depositor: msg.sender,
            receiver: receiver,
            assets: shares,
            completed: false
        });
        userRedeemRecord[msg.sender] = requestId;
        // Record the redeem request, similar to deposit handling
        emit RedeemRequest(receiver, owner, requestId, owner, shares);

        return requestId;
    }

    function redeem(uint256 requestId) external onlyOwner {
        RedeemRecord storage record = redeemRecords[requestId];
        require(!record.completed, "Redeem already processed");
        uint256 assets = convertToAssets(record.assets); // Implement this conversion

        SafeERC20.safeTransferFrom(
            IERC20(paymentToken),
            record.receiver,
            address(this),
            assets
        );
        record.completed = true;
        emit RedeemClaimable(
            record.depositor,
            requestId,
            record.assets,
            assets
        );
    }
    function pendingDepositRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 pendingAssets) {
        DepositRecord memory record = depositRecords[requestId];
        return record.assets;
    }

    function pendingRedeemRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 pendingShares) {
        RedeemRecord memory record = redeemRecords[requestId];
        return record.assets;
    }

    function claimableDepositRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 isPending) {
        DepositRecord memory record = depositRecords[requestId];
        require(record.assets > 0, "no deposit found");
        return record.assets;
    }

    function claimableRedeemRequest(
        uint256 requestId,
        address owner
    ) external view returns (uint256 claimableShares) {
        RedeemRecord memory record = redeemRecords[requestId];
        require(record.assets > 0, "no asset to redeem");
        return record.assets;
    }

    // these don't get used but are required in interface
    function emitDepositClaimable(
        address owner,
        uint256 assets,
        uint256 shares
    ) public {
        emit DepositClaimable(owner, 0, assets, shares);
    }

    function emitRedeemClaimable(
        address owner,
        uint256 assets,
        uint256 shares
    ) public {
        emit RedeemClaimable(owner, 0, assets, shares);
    }
    // Add methods to manage request states (pending, claimable)...
}
