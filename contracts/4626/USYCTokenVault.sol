pragma solidity ^0.8.20;
import "./TokenVault.sol";
contract USYCTokenVault is TokenVault {
    // Mapping to track pending deposit amounts by user
    mapping(address => uint256) public _pendingDeposits;
    constructor(
        IERC20 asset_,
        string memory name,
        string memory symbol
    ) TokenVault(asset_) ERC20(name, symbol) {}
}
