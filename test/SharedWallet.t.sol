// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/SharedWallet.sol";

contract SharedWalletTest is Test {
    using stdStorage for StdStorage;
    SharedWallet public wallet;
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address charlie = makeAddr("charlie");

    function setUp() public {
        vm.prank(alice);
        wallet = new SharedWallet();
    }

    // a. The contract is deployed successfully.
    function testCreateContract() public {
        assertEq(wallet.owner(), alice);
    }    
}
