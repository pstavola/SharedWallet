// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../lib/forge-std/src/Test.sol";
import "../src/SharedWallet.sol";

contract SharedWalletTest is Test {
    using stdStorage for StdStorage;
    SharedWallet public wallet;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");

    function setUp() public {
        vm.startPrank(alice);
        wallet = new SharedWallet();
        vm.deal(alice, 10000 ether);
        vm.deal(bob, 10000 ether);
        vm.deal(charlie, 10000 ether);
        (bool sent, ) = address(wallet).call{value: 1000 ether}("");
    }

    // a. Owner is the deploying address.
    function testOwner() public {
        assertEq(wallet.owner(), alice);
    }

    // b. Contract balance is correct.
    function testCheckBalance() public {
        assertEq(wallet.checkBalance(), 1000 ether);
    }

    // c. Owner can create a new user allowance.
    function testCreateNewAllowance() public {
        wallet.renewAllowance(bob, 100 ether, 600);
        changePrank(bob);
        assertEq(wallet.checkAllowance(), 100 ether);
    }

    // d. Owner can update an existing user allowance.
    function testUpdateAllowance() public {
        wallet.renewAllowance(bob, 100 ether, 600);
        vm.roll(block.number+1);
        wallet.renewAllowance(bob, 100 ether, 600);
        changePrank(bob);
        assertEq(wallet.checkAllowance(), 200 ether);
    }

    // e. Owner cannot grant allowance greater than contract balance.
    function testCannoAllowMoreThanBalance() public {
        vm.expectRevert(abi.encodePacked("Allowance exceeds contract current balance"));
        wallet.renewAllowance(bob, 2000 ether, 600);
    }

    // f. User cannot send coins if not allowed by owner.
    function testCannoSendIfNotAllowed() public {
        changePrank(bob);
        vm.expectRevert(abi.encodePacked("Not enough coins in your allowance"));
        wallet.sendCoins(10 ether, payable(charlie));
    }

    // g. User cannot send coins if time limit is expired.
    function testCannoSendIfExpired() public {
        wallet.renewAllowance(bob, 100 ether, 600);
        vm.warp(block.timestamp + 700);
        changePrank(bob);
        vm.expectRevert(abi.encodePacked("Time limit expired"));
        wallet.sendCoins(10 ether, payable(charlie));
    }

    // h. User cannot send transactions with 0 amount.
    function testCannoSendZero() public {
        wallet.renewAllowance(bob, 100 ether, 600);
        changePrank(bob);
        vm.expectRevert(abi.encodePacked("Amount must be more than 0"));
        wallet.sendCoins(0, payable(charlie));
    }

    // i. User cannot send transactions which value exceed contract balance.
    function testCannotSendMoreThanBalance() public {
        wallet.renewAllowance(bob, 600 ether, 600);
        wallet.renewAllowance(charlie, 600 ether, 600);
        vm.roll(block.number+1);
        changePrank(bob);
        wallet.sendCoins(600 ether, payable(charlie));
        changePrank(charlie);
        vm.expectRevert(abi.encodePacked("Amount exceeds contract current balance"));
        wallet.sendCoins(600 ether, payable(bob));
    }
    
    // j. User can send coins successfully.
    function testSendCoins() public {
        wallet.renewAllowance(bob, 100 ether, 600);
        changePrank(bob);
        wallet.sendCoins(10 ether, payable(charlie));
        assertEq(wallet.checkAllowance(), 90 ether);
        assertEq(wallet.checkBalance(), 990 ether);
        assertEq(charlie.balance, 10010 ether);
    }
}
