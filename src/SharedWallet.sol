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

        User memory userAllowance = users[_user];
        userAllowance.amount += _amount;
        userAllowance.timeLimit = block.timestamp + _timeLimit;
        users[_user] = userAllowance;
    }

    function sendCoins(uint _amount, address payable _receiver) public {
        User memory userAllowance = users[msg.sender];
        require(_amount > 0, "Amount must be more than 0");
        require(_amount <= userAllowance.amount, "Not enough coins");
        require(block.timestamp <= userAllowance.timeLimit, "Time limit expired");

        userAllowance.amount -= _amount;
        users[msg.sender] = userAllowance;
        totalAllowance -= _amount;

        (bool sent, ) = _receiver.call{value: _amount}("");
        require(sent, "Failed to send coins");
    }

    function checkAllowance() public view returns (uint,uint) {
        User memory userAllowance = users[msg.sender];
        return(userAllowance.amount, userAllowance.timeLimit);
    }

    function checkBalance() public view returns (uint) {
        return(address(this).balance);
    }
}