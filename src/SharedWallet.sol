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

    /* ========== GLOBAL VARIABLES ========== */

    ///@notice mapping to handle authorised addresses
    mapping(address => User) public users;

    /* ========== EVENTS ========== */

    event AllowanceRenewed(address indexed user, uint amount, uint timeLimit);
    event CoinsSent(address indexed receiver, uint amount);
    event Deposit(uint amount);

    /* ========== FUNCTIONS ========== */

    receive() external payable onlyOwner {
        emit Deposit(msg.value);
    }

    /**
     * @notice renewAllowance renew/create a new allowance. Only owner of the contract can add allowances. It checks if allowance amount is more than contract balance and stores user allowance in gloabal variable
     * @param _user user address for the new allowance
     * @param _amount amount of coins to be allowed
     * @param _timeLimit validity period in seconds
    */
    function renewAllowance(address _user, uint _amount, uint _timeLimit) public onlyOwner {
        require(_amount <= address(this).balance, "Allowance exceeds contract current balance");

        User memory userAllowance = users[_user];
        userAllowance.amount += _amount;
        userAllowance.timeLimit = block.timestamp + _timeLimit;
        users[_user] = userAllowance;

        emit AllowanceRenewed(_user, _amount, _timeLimit);
    }

    /**
     * @notice send coins to the desired address. It checks that contract has enough coins to send and that user allowance is repsected for amount and validity period
     * @param _amount amount of coins to be sent
     * @param _receiver address to which coins will be sent
    */
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

    /**
     * @notice send coins to the desired address. It checks that contract has enough coins to send and that user allowance is repsected for amount and validity period
     * @return uint amount defined in user allowance
    */
    function checkAllowance() public view returns (uint) {
        return(users[msg.sender].amount);
    }

    /**
     * @notice send coins to the desired address. It checks that contract has enough coins to send and that user allowance is repsected for amount and validity period
     * @return uint amount of contract balance
    */
    function checkBalance() public view returns (uint) {
        return(address(this).balance);
    }
}