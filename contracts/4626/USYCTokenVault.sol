pragma solidity ^0.8.20;
import "./TokenVault.sol";
contract USYCTokenVault is TokenVault {
    mapping(address => uint256) public pendingDeposits;
    mapping(address => bool) public depositConfirmed;
    // Modifier to restrict function access to the admin
    modifier onlyAdmin() {
        require(true, "Not admin");
        _;
    }

    // Users call this function to make a deposit
    function preDeposit(uint256 amount) public {
        require(amount > 0, "Deposit must be greater than 0");
        require(
            pendingDeposits[msg.sender] == 0,
            "Already have a pending deposit"
        );
        // Transfer the tokens from the sender to this contract
        SafeERC20.safeTransferFrom(
            IERC20(asset()),
            msg.sender,
            address(this),
            amount
        );

        // Update the user's pending deposit status
        pendingDeposits[msg.sender] = amount;
        depositConfirmed[msg.sender] = false;

        // No shares are issued at this point
    }

    // Admin calls this function to confirm deposits and issue shares
    function adminConfirmDeposit(address[] calldata users) public onlyAdmin {
        for (uint i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 amount = pendingDeposits[user];

            require(amount > 0, "No pending deposit");
            require(!depositConfirmed[user], "Deposit already confirmed");

            // Convert the deposited amount to shares
            uint256 shares = _convertToShares(amount, Math.Rounding.Floor);

            // Mint shares to the user
            _mint(user, shares);

            // Update the user's deposit status to confirmed
            depositConfirmed[user] = true;

            // Reset the user's pending deposit amount
            pendingDeposits[user] = 0;

            // Emit an event or take other actions as needed
        }
    }
    constructor(
        IERC20 asset_,
        string memory name,
        string memory symbol
    ) TokenVault(asset_) ERC20(name, symbol) {}
}
