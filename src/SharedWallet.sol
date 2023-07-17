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

    event AllowanceRenewed(address indexed user, uint amount, uint timeLimit);
    event CoinsSent(address indexed receiver, uint amount);
    event Deposit(uint amount);

    mapping(address => User) public users;

    receive() external payable onlyOwner {
        emit Deposit(msg.value);
    }

    function renewAllowance(address _user, uint _amount, uint _timeLimit) public onlyOwner {
        require(_amount <= address(this).balance, "Allowance exceeds contract current balance");

        User memory userAllowance = users[_user];
        userAllowance.amount += _amount;
        userAllowance.timeLimit = block.timestamp + _timeLimit;
        users[_user] = userAllowance;

        emit AllowanceRenewed(_user, _amount, _timeLimit);
    }

    function sendCoins(uint _amount, address payable _receiver) public {
        User memory userAllowance = users[msg.sender];
        require(_amount > 0, "Amount must be more than 0");
        require(_amount <= address(this).balance, "Amount exceeds contract current balance");
        require(_amount <= userAllowance.amount, "Not enough coins in your allowance");
        require(block.timestamp <= userAllowance.timeLimit, "Time limit expired");

        userAllowance.amount -= _amount;
        users[msg.sender] = userAllowance;

        (bool sent, ) = _receiver.call{value: _amount}("");
        require(sent, "Failed to send coins");

        emit CoinsSent(_receiver, _amount);
    }

    function checkAllowance() public view returns (uint) {
        return(users[msg.sender].amount);
    }

    function checkBalance() public view returns (uint) {
        return(address(this).balance);
    }
}