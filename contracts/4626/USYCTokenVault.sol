pragma solidity ^0.8.20;
import "./TokenVault.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract USYCTokenVault is TokenVault, Ownable {
    mapping(address => uint256) public depositAmount;
    mapping(address => uint256) public shareAmountToRedeem;
    mapping(address => string) public status;
    address[] public pendingDepositAddresses;
    address[] public pendingWithdrawAddresses;
    IERC20 public paymentToken;
    event DepositPending(address user, uint256 amount);
    event DepositConfirmed(address user, uint256 amount);
    event WithdrawPending(address user, uint256 shares);
    event WithdrawConfirmed(address user, uint256 shares);
    function addPendingDepositAddress(address _address) private {
        pendingDepositAddresses.push(_address);
    }
    function resetPendingDepositAddresses() private {
        delete pendingDepositAddresses;
    }
    function addPendingWithdrawAddress(address _address) private {
        pendingWithdrawAddresses.push(_address);
    }
    function resetPendingWithdrawAddresses() private {
        delete pendingWithdrawAddresses;
    }
    // Users call this function to make a deposit
    function preDeposit(uint256 amount) public {
        require(amount > 0, "Deposit must be greater than 0");
        require(
            paymentToken.balanceOf(msg.sender) >= amount,
            "amount is greater than user balance"
        );
        require(
            depositAmount[msg.sender] == 0,
            "Already have a pending deposit"
        );
        // Transfer the tokens from the sender to this contract
        SafeERC20.safeTransferFrom(
            IERC20(paymentToken),
            msg.sender,
            address(this),
            amount
        );
        depositAmount[msg.sender] = amount;
        status[msg.sender] = "DepositPending";
        addPendingDepositAddress(msg.sender);
        emit DepositConfirmed(msg.sender, amount);
    }

    // Admin calls this function to confirm deposits and issue shares
    function executeDeposit() public onlyOwner {
        for (uint i = 0; i < pendingDepositAddresses.length; i++) {
            address user = pendingDepositAddresses[i];
            uint256 amount = depositAmount[user];
            require(amount > 0, "No pending deposit");
            require(
                compareStrings(status[user], "DepositPending"),
                "No pending deposit"
            );
            // Convert the deposited amount to shares
            //TODO find conversion for token amount into asset
            // uint256 shares = _convertToShares(amount, Math.Rounding.Floor);
            // Mint shares to the user
            _mint(user, amount);
            // Update the user's deposit status to confirmed
            status[user] = "DepositConfirmed";
            depositAmount[user] = 0;
            // Emit an event or take other actions as needed
            emit DepositConfirmed(pendingDepositAddresses[i], amount);
        }
        resetPendingDepositAddresses();
    }

    function preWithdraw(uint256 amount) public {
        uint256 shares = balanceOf(msg.sender); // Get the user's share balance
        require(shares >= amount, "amount is greater than balance");
        require(shares > 0, "You have no shares to withdraw");
        _burn(msg.sender, amount);
        shareAmountToRedeem[msg.sender] =
            amount +
            shareAmountToRedeem[msg.sender];
        addPendingWithdrawAddress(msg.sender);
        emit WithdrawPending(msg.sender, shareAmountToRedeem[msg.sender]);
    }

    function executeWithdraw() public onlyOwner {
        for (uint i = 0; i < pendingWithdrawAddresses.length; i++) {
            address user = pendingWithdrawAddresses[i];
            uint256 withdrawAmount = shareAmountToRedeem[user];
            // require(withdrawAmount > 0, "No pending withdrawal");
            // Transfer the deposited asset back to the user.
            // Ensure `paymentToken` is the ERC20 token users deposited.
            //TODO convert shares to paymentToken
            SafeERC20.safeTransfer(
                paymentToken,
                user,
                withdrawAmount // TODO
            );
            // Mark the withdrawal as confirmed
            status[user] = "WithdrawConfirmed";
            // Reset the user's pending withdrawal amount
            shareAmountToRedeem[user] = 0;
            emit WithdrawConfirmed(user, withdrawAmount);
            // Emit an event or take other actions as needed
        }
        resetPendingWithdrawAddresses();
    }
    constructor(
        IERC20 asset_,
        IERC20 _paymentToken,
        address _owner,
        string memory name,
        string memory symbol
    ) TokenVault(asset_) ERC20(name, symbol) Ownable(_owner) {
        paymentToken = IERC20(_paymentToken);
    }
    //helpers
    function compareStrings(
        string memory a,
        string memory b
    ) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
