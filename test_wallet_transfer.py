#!/usr/bin/env python3
"""
Test wallet-to-wallet transfer on ABR testnet
"""
import json
import time
import requests
from src.abr-chain.core.blockchain import Blockchain, Wallet

def test_transfer():
    print("=" * 60)
    print("ABR Protocol - Wallet Transfer Test")
    print("=" * 60)
    
    # Initialize testnet
    print("\n1. Starting testnet...")
    chain = Blockchain(network="testnet")
    wallet_mgr = Wallet()
    
    # Create wallets
    print("\n2. Creating wallets...")
    wallet1 = wallet_mgr.create_wallet("alice")
    wallet2 = wallet_mgr.create_wallet("bob")
    
    print(f"   Alice: {wallet1['address']}")
    print(f"   Bob:   {wallet2['address']}")
    
    # Check initial balances
    print("\n3. Initial balances:")
    alice_balance = chain.get_balance(wallet1['address']) / 10**8
    bob_balance = chain.get_balance(wallet2['address']) / 10**8
    print(f"   Alice: {alice_balance:.2f} ABR")
    print(f"   Bob:   {bob_balance:.2f} ABR")
    
    # Fund Alice from genesis (for testing)
    print("\n4. Funding Alice from genesis...")
    genesis_addr = "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ"
    fund_tx = chain.create_transaction(
        from_addr=genesis_addr,
        to_addr=wallet1['address'],
        amount=10000 * 10**8,  # 10,000 ABR
        fee=1000
    )
    
    if fund_tx:
        success, msg = chain.send_transaction(fund_tx)
        print(f"   {msg}")
        
        # Mine the transaction
        print("\n5. Mining block...")
        chain.start_mining(wallet1['address'])
        time.sleep(5)  # Mine for 5 seconds
        chain.stop_mining()
    
    # Check updated balance
    alice_balance = chain.get_balance(wallet1['address']) / 10**8
    print(f"\n6. Updated balances after funding:")
    print(f"   Alice: {alice_balance:.2f} ABR")
    
    # Transfer from Alice to Bob
    print("\n7. Transferring 1000 ABR from Alice to Bob...")
    transfer_tx = chain.create_transaction(
        from_addr=wallet1['address'],
        to_addr=wallet2['address'],
        amount=1000 * 10**8,  # 1000 ABR
        fee=1000,
        private_key=wallet1['private_key']
    )
    
    if transfer_tx:
        success, msg = chain.send_transaction(transfer_tx)
        print(f"   {msg}")
        
        # Mine the transaction
        print("\n8. Mining block...")
        chain.start_mining(wallet2['address'])
        time.sleep(5)
        chain.stop_mining()
    
    # Final balances
    alice_balance = chain.get_balance(wallet1['address']) / 10**8
    bob_balance = chain.get_balance(wallet2['address']) / 10**8
    
    print("\n9. Final balances:")
    print(f"   Alice: {alice_balance:.2f} ABR")
    print(f"   Bob:   {bob_balance:.2f} ABR")
    
    # Verify transfer
    expected_alice = 10000 - 1000 - 0.00001  # 10000 sent - 1000 transfer - fee
    expected_bob = 1000
    
    if abs(alice_balance - expected_alice) < 0.1 and abs(bob_balance - expected_bob) < 0.1:
        print("\n✅ Transfer successful! Wallet-to-wallet transaction works!")
    else:
        print("\n❌ Transfer verification failed")
    
    print("\n" + "=" * 60)
    
    # Show UTXOs
    print("\nUTXOs for Bob:")
    bob_utxos = chain.get_address_utxos(wallet2['address'])
    for i, utxo in enumerate(bob_utxos):
        print(f"   UTXO {i}: {utxo['amount'] / 10**8} ABR from tx {utxo['txid'][:16]}...")

if __name__ == "__main__":
    test_transfer()
