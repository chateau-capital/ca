pragma solidity ^0.8.20;
import "./TokenVault.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract USYCTokenVault is TokenVault, Ownable {
    mapping(address => uint256) public depositAmount;
    mapping(address => string) public status;
    mapping(address => uint256) public shareAmount;
    IERC20 public paymentToken;
    event DepositsConfirmed(address user, uint256 amount, uint256 shares);
    // Users call this function to make a deposit
    function preDeposit(uint256 amount) public {
        require(amount > 0, "Deposit must be greater than 0");
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
        // No shares are issued at this point
    }

    // Admin calls this function to confirm deposits and issue shares
    function adminConfirmDeposit(address[] calldata users) public onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 amount = depositAmount[user];
            require(amount > 0, "No pending deposit");
            require(
                compareStrings(status[user], "DepositPending"),
                "Deposit already confirmed"
            );
            // Convert the deposited amount to shares
            uint256 shares = _convertToShares(amount, Math.Rounding.Floor);
            // Mint shares to the user
            _mint(user, shares);
            // Update the user's deposit status to confirmed
            status[msg.sender] = "DepositConfirmed";
            // Emit an event or take other actions as needed
            emit DepositsConfirmed(users[i], amount, shares);
        }
    }

    function preWithdraw() public {
        uint256 shareBalance = balanceOf(msg.sender); // Get the user's share balance
        require(
            shareBalance == depositAmount[msg.sender],
            "You have no shares to withdraw"
        );
        require(depositAmount[msg.sender] > 0, "No deposit to withdraw");
        require(
            compareStrings(status[msg.sender], "DepositConfirmed"),
            "Deposit not confirmed, cannot withdraw"
        );

        // Assuming _burn function is available and it burns the user's shares equivalent to their deposit
        _burn(msg.sender, balanceOf(msg.sender));
        status[msg.sender] = "WithdrawPending";
        // Additional logic to actually return the deposited assets to the user should be implemented here
    }

    function adminConfirmWithdraw(address[] calldata users) public onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 withdrawAmount = shareAmount[user];
            require(withdrawAmount > 0, "No pending withdrawal");
            require(
                compareStrings(status[user], "WithdrawPending"),
                "user is not availble to withdraw"
            );
            // Transfer the deposited asset back to the user.
            // Ensure `paymentToken` is the ERC20 token users deposited.
            SafeERC20.safeTransfer(
                paymentToken,
                user,
                depositAmount[msg.sender]
            );
            // Mark the withdrawal as confirmed
            status[user] = "WithdrawConfirmed";
            // Reset the user's pending withdrawal amount
            depositAmount[user] = 0;
            shareAmount[user] = 0;
            // Emit an event or take other actions as needed
        }
    }
    constructor(
        IERC20 asset_,
        IERC20 _paymentToken,
        address _owner,
        string memory name,
        string memory symbol
    ) TokenVault(asset_) ERC20(name, symbol) Ownable(_owner) {
        paymentToken = _paymentToken;
    }
    //helpers
    function compareStrings(
        string memory a,
        string memory b
    ) private pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}
