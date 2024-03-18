// import "../interface/IERC7540.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "./TokenVault.sol";
// pragma solidity ^0.8.20;
// contract USYCVault is Ownable, IERC7540, TokenVault {
//     /// @dev    Requests for USYC pool are non-transferable and all have ID = 0
//     uint256 constant REQUEST_ID = 0;
//     constructor() {}
//     /**
//      * @dev Transfers assets from sender into the Vault and submits a Request for asynchronous deposit.
//      *
//      * - MUST support ERC-20 approve / transferFrom on asset as a deposit Request flow.
//      * - MUST revert if all of assets cannot be requested for deposit.
//      * - owner MUST be msg.sender unless some unspecified explicit approval is given by the caller,
//      *    approval of ERC-20 tokens from owner to sender is NOT enough.
//      *
//      * @param assets the amount of deposit assets to transfer from owner
//      * @param receiver the receiver of the request who will be able to operate the request
//      * @param owner the source of the deposit assets
//      * @param data additional bytes which may be used to approve or call the receiver contract
//      *
//      * NOTE: most implementations will require pre-approval of the Vault with the Vault's underlying asset token.
//      *
//      * If data is nonzero, attempt to call the receiver onERC7540DepositReceived,
//      * otherwise just send the request to the receiver
//      */
//     function requestDeposit(
//         uint256 assets,
//         address receiver,
//         address owner,
//         bytes memory data
//     ) public returns (uint256) {
//         require(owner == msg.sender, "not msg.sender");
//         require(asset > 0, "Deposit must be greater than 0");
//         require(
//             asset.balanceOf(msg.sender) >= assets,
//             "amount is greater than user balance"
//         );
//         // Transfer the tokens from the sender to this contract
//         deposit(assets, receiver);
//         //  onERC7540DepositReceived(
//         //     msg.sender,
//         //     owner,
//         //     REQUEST_ID
//         //     _shares,
//         //     _data
//         // );
//     }
//     /**
//      * @dev Returns the amount of requested assets in Pending state.
//      *
//      * - MUST NOT include any assets in Claimable state for deposit or mint.
//      * - MUST NOT show any variations depending on the caller.
//      * - MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
//      */
//     function pendingDepositRequest(
//         uint256,
//         address owner
//     ) public view returns (uint256 pendingAssets) {}
//     /**
//      * @dev Returns the amount of requested assets in Claimable state for the owner to deposit or mint.
//      *
//      * - MUST NOT include any assets in Pending state.
//      * - MUST NOT show any variations depending on the caller.
//      * - MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
//      */
//     function claimableDepositRequest(
//         uint256 requestId,
//         address owner
//     ) external view returns (uint256 claimableAssets) {}
// }
