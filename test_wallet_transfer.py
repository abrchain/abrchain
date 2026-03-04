#!/usr/bin/env python3
"""
ABR Protocol Wallet Transfer Test
Tests wallet-to-wallet transfers on the ABR network
"""

import asyncio
import json
import sys
from datetime import datetime

from abrchain.wallet.wallet import Wallet
from abrchain.core.transaction import Transaction
from abrchain.core.blockchain import Blockchain

# Test addresses (from genesis)
TEST_ADDRESSES = {
    "alice": "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ",
    "bob": "3ZA9a8bf3ebbe6f826e39772c4763bea72",
    "charlie": "3Af786874742181e8c921c12e7ed5329c5"
}

async def test_wallet_creation():
    """Test wallet creation"""
    print("\n📝 Testing Wallet Creation...")
    
    wallet = Wallet()
    address = wallet.create_address()
    
    print(f"✅ Created wallet address: {address[:20]}...")
    return wallet

async def test_balance_check(wallet, address):
    """Test balance check"""
    print(f"\n💰 Checking balance for {address[:20]}...")
    
    balance = await wallet.get_balance(address)
    print(f"✅ Balance: {balance} ABR")
    return balance

async def test_transfer(from_wallet, to_address, amount):
    """Test transfer between wallets"""
    print(f"\n💸 Testing transfer of {amount} ABR to {to_address[:20]}...")
    
    try:
        tx = await from_wallet.send(to_address, amount)
        print(f"✅ Transaction sent: {tx['txid'][:16]}...")
        return tx
    except Exception as e:
        print(f"❌ Transfer failed: {e}")
        return None

async def test_transaction_status(txid):
    """Test transaction status check"""
    print(f"\n🔍 Checking transaction {txid[:16]}...")
    
    blockchain = Blockchain()
    status = await blockchain.get_transaction_status(txid)
    
    if status:
        print(f"✅ Transaction confirmed in block {status['block']}")
        print(f"   Confirmations: {status['confirmations']}")
    else:
        print("⏳ Transaction pending...")
    
    return status

async def main():
    """Main test function"""
    print("╔═══════════════════════════════════════════════════════════════════╗")
    print("║                                                                   ║")
    print("║              ABR PROTOCOL - WALLET TRANSFER TEST                 ║")
    print("║                         v2.0.0                                    ║")
    print("║                                                                   ║")
    print("╚═══════════════════════════════════════════════════════════════════╝")
    
    # Test parameters
    TEST_AMOUNT = 1000
    TEST_FEE = 0.01
    
    print(f"\n📋 Test Parameters:")
    print(f"   Amount: {TEST_AMOUNT} ABR")
    print(f"   Fee: {TEST_FEE} ABR")
    print(f"   Timestamp: {datetime.utcnow().isoformat()}")
    
    # Run tests
    try:
        # Create wallets
        alice_wallet = await test_wallet_creation()
        bob_wallet = await test_wallet_creation()
        
        # Check balances
        alice_balance = await test_balance_check(alice_wallet, TEST_ADDRESSES["alice"])
        bob_balance = await test_balance_check(bob_wallet, TEST_ADDRESSES["bob"])
        
        print(f"\n📊 Initial Balances:")
        print(f"   Alice: {alice_balance} ABR")
        print(f"   Bob: {bob_balance} ABR")
        
        # Perform transfer
        if alice_balance >= TEST_AMOUNT:
            tx = await test_transfer(alice_wallet, TEST_ADDRESSES["bob"], TEST_AMOUNT)
            
            if tx:
                # Check transaction status
                await asyncio.sleep(2)  # Wait for propagation
                await test_transaction_status(tx['txid'])
                
                # Check updated balances
                new_alice_balance = await test_balance_check(alice_wallet, TEST_ADDRESSES["alice"])
                new_bob_balance = await test_balance_check(bob_wallet, TEST_ADDRESSES["bob"])
                
                print(f"\n📊 Final Balances:")
                print(f"   Alice: {new_alice_balance} ABR (change: {new_alice_balance - alice_balance})")
                print(f"   Bob: {new_bob_balance} ABR (change: {new_bob_balance - bob_balance})")
                
                # Verify transfer
                if new_bob_balance - bob_balance == TEST_AMOUNT:
                    print(f"\n✅ TEST PASSED: Transfer successful!")
                else:
                    print(f"\n❌ TEST FAILED: Balance mismatch")
            else:
                print(f"\n❌ TEST FAILED: Transfer failed")
        else:
            print(f"\n⚠️  Insufficient balance for test")
    
    except Exception as e:
        print(f"\n❌ Test error: {e}")
        return 1
    
    print("\n" + "=" * 60)
    print("🎉 Wallet transfer test complete")
    return 0

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
