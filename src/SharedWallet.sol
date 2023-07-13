 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SharedWallet
 * @author Patrizio Stavola
 * @notice A shared wallet to which admin send funds that can then be spent by authorised addresses limited by amounts and time limits
*/
contract SharedWallet is 
    Ownable
{
    ///@notice structure that defines users
    struct User {
        uint256 amount;
        uint256 timeLimit;
    }

    mapping(address => User) public users;


    receive() external payable onlyOwner {}
}