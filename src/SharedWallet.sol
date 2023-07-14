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
        uint amount;
        uint timeLimit;
    }

    mapping(address => User) public users;
    uint public totalAllowance;

    receive() external payable onlyOwner {}

    function renewAllowance(address _user, uint _amount, uint _timeLimit) public onlyOwner {
        totalAllowance += _amount;
        require(totalAllowance <= address(this).balance, "Total allowance exceeds contract current balance");
        require(_amount <= address(this).balance, "Amount is more than current balance");

        //User memory allowance = User({amount: _amount, timeLimit: block.timestamp + _timeLimit});
        User memory userAllowance = users[_user];
        userAllowance.amount += _amount;
        if (userAllowance.timeLimit == 0)
            userAllowance.timeLimit = block.timestamp + _timeLimit;
        else
            userAllowance.timeLimit += _timeLimit;
        users[_user] = userAllowance;
    }

    function sendCoins(uint _amount, address payable _receiver) public {
        User memory userAllowance = users[msg.sender];
        require(_amount > 0, "Amount must be more than 0");
        require(_amount <= userAllowance.amount, "Not enough coins");
        require(userAllowance.timeLimit > 0 && block.timestamp <= userAllowance.timeLimit, "Time limit expired");

        userAllowance.amount -= _amount;
        users[msg.sender] = userAllowance;

        (bool sent, ) = _receiver.call{value: _amount}("");
        require(sent, "Failed to send coins");
    }
}