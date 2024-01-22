//SPDX-License-Identifier: UNLICENSED
pragma experimental ABIEncoderV2;

interface  IQuadrata {
        struct Attribute {
        bytes32 value;
        uint256 epoch;
        address issuer;
    }
   function getAttribute(
        address _account, bytes32 _attribute
    ) external payable returns(Attribute memory);
}