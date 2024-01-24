// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface  IStakingPool {
    function isSettled() external view returns (bool);
}