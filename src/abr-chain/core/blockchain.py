#!/usr/bin/env python3
"""
ABR Chain - Core Blockchain Implementation
"""
import hashlib
import json
import time
import threading
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
import sqlite3
import os
import requests
from datetime import datetime

# ============================================================
# DATA STRUCTURES
# ============================================================

class TransactionType(Enum):
    COINBASE = "coinbase"
    TRANSFER = "transfer"
    STAKE = "stake"
    UNSTAKE = "unstake"

@dataclass
class Transaction:
    txid: str
    version: int = 1
    type: TransactionType = TransactionType.TRANSFER
    inputs: List[Dict] = field(default_factory=list)
    outputs: List[Dict] = field(default_factory=list)
    locktime: int = 0
    timestamp: int = field(default_factory=lambda: int(time.time()))
    fee: int = 0
    signature: str = ""
    pubkey: str = ""
    
    def calculate_hash(self) -> str:
        """Calculate transaction hash"""
        data = {
            "version": self.version,
            "type": self.type.value,
            "inputs": self.inputs,
            "outputs": self.outputs,
            "locktime": self.locktime,
            "timestamp": self.timestamp,
            "fee": self.fee
        }
        return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
    
    def to_dict(self) -> Dict:
        return {
            "txid": self.txid,
            "version": self.version,
            "type": self.type.value,
            "inputs": self.inputs,
            "outputs": self.outputs,
            "locktime": self.locktime,
            "timestamp": self.timestamp,
            "fee": self.fee,
            "signature": self.signature,
            "pubkey": self.pubkey
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Transaction':
        tx = cls(
            txid=data.get('txid', ''),
            version=data.get('version', 1),
            type=TransactionType(data.get('type', 'transfer')),
            inputs=data.get('inputs', []),
            outputs=data.get('outputs', []),
            locktime=data.get('locktime', 0),
            timestamp=data.get('timestamp', int(time.time())),
            fee=data.get('fee', 0),
            signature=data.get('signature', ''),
            pubkey=data.get('pubkey', '')
        )
        if not tx.txid:
            tx.txid = tx.calculate_hash()
        return tx
    
    def validate(self, utxo_set: Dict) -> Tuple[bool, str]:
        """Validate transaction"""
        # Coinbase transactions are always valid
        if self.type == TransactionType.COINBASE:
            return True, "Valid coinbase"
        
        # Check inputs
        total_input = 0
        for inp in self.inputs:
            utxo_key = f"{inp['txid']}:{inp['vout']}"
            if utxo_key not in utxo_set:
                return False, f"UTXO not found: {utxo_key}"
            utxo = utxo_set[utxo_key]
            if utxo.get('spent', False):
                return False, f"UTXO already spent: {utxo_key}"
            total_input += utxo['amount']
        
        # Check outputs
        total_output = sum(out['amount'] for out in self.outputs)
        if total_output > total_input:
            return False, "Insufficient funds"
        
        # Check fee
        if total_input - total_output < self.fee:
            return False, "Insufficient fee"
        
        return True, "Valid"

@dataclass
class Block:
    height: int
    hash: str
    previous_hash: str
    timestamp: int
    transactions: List[Transaction]
    merkle_root: str
    nonce: int
    bits: str
    difficulty: int
    version: int = 1
    reward: int = 1190 * 10**8  # 1190 ABR in satoshis
    
    def calculate_merkle_root(self) -> str:
        """Calculate merkle root of transactions"""
        if not self.transactions:
            return hashlib.sha256(b'').hexdigest()
        
        tx_hashes = [tx.txid for tx in self.transactions]
        while len(tx_hashes) > 1:
            if len(tx_hashes) % 2 != 0:
                tx_hashes.append(tx_hashes[-1])
            new_hashes = []
            for i in range(0, len(tx_hashes), 2):
                combined = tx_hashes[i] + tx_hashes[i+1]
                new_hashes.append(hashlib.sha256(combined.encode()).hexdigest())
            tx_hashes = new_hashes
        return tx_hashes[0]
    
    def calculate_hash(self) -> str:
        """Calculate block hash"""
        data = {
            "height": self.height,
            "previous_hash": self.previous_hash,
            "timestamp": self.timestamp,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce,
            "bits": self.bits,
            "version": self.version
        }
        return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()
    
    def mine(self, target: int) -> bool:
        """Mine the block (Proof of Work)"""
        while self.nonce < 2**32:
            self.hash = self.calculate_hash()
            if int(self.hash, 16) < target:
                return True
            self.nonce += 1
        return False
    
    def to_dict(self) -> Dict:
        return {
            "height": self.height,
            "hash": self.hash,
            "previous_hash": self.previous_hash,
            "timestamp": self.timestamp,
            "merkle_root": self.merkle_root,
            "nonce": self.nonce,
            "bits": self.bits,
            "difficulty": self.difficulty,
            "version": self.version,
            "reward": self.reward,
            "transactions": [tx.to_dict() for tx in self.transactions]
        }

# ============================================================
# BLOCKCHAIN CLASS
# ============================================================

class Blockchain:
    def __init__(self, data_dir: str = "~/.abr/data", network: str = "mainnet"):
        self.data_dir = os.path.expanduser(data_dir)
        self.network = network
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.blocks: List[Block] = []
        self.utxo_set: Dict[str, Dict] = {}
        self.mempool: List[Transaction] = []
        self.orphan_pool: List[Block] = []
        self.addr_index: Dict[str, List[str]] = {}  # address -> [txids]
        
        # Network parameters
        if network == "mainnet":
            self.difficulty = 1
            self.target = 0xffff0000 * 2**(8*(0x1d - 3))
            self.block_reward = 1190 * 10**8
            self.halving_interval = 840000
            self.max_supply = 1_000_000_000 * 10**8
            self.min_stake = 1000 * 10**8
            self.port = 9333
            self.rpc_port = 9332
        else:  # testnet
            self.difficulty = 1
            self.target = 0xffff0000 * 2**(8*(0x1e - 3))  # Easier for testnet
            self.block_reward = 1190 * 10**8
            self.halving_interval = 8400  # Shorter for testnet
            self.max_supply = 10_000_000 * 10**8  # 10M for testnet
            self.min_stake = 100 * 10**8
            self.port = 19333
            self.rpc_port = 19332
        
        self.chain_lock = threading.Lock()
        self.new_block_event = threading.Event()
        self.is_mining = False
        self.mining_thread = None
        
        # Initialize database
        self._init_db()
        
        # Load from disk or create genesis
        self._load_from_disk()
    
    def _init_db(self):
        """Initialize SQLite database"""
        self.conn = sqlite3.connect(f"{self.data_dir}/chain.db", check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.cursor = self.conn.cursor()
        
        # Create tables
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS blocks (
                height INTEGER PRIMARY KEY,
                hash TEXT UNIQUE,
                previous_hash TEXT,
                timestamp INTEGER,
                merkle_root TEXT,
                nonce INTEGER,
                bits TEXT,
                difficulty INTEGER,
                version INTEGER,
                reward INTEGER
            )
        """)
        
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                txid TEXT PRIMARY KEY,
                block_height INTEGER,
                type TEXT,
                timestamp INTEGER,
                fee INTEGER,
                raw TEXT,
                FOREIGN KEY(block_height) REFERENCES blocks(height)
            )
        """)
        
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS utxos (
                outpoint TEXT PRIMARY KEY,
                txid TEXT,
                vout INTEGER,
                address TEXT,
                amount INTEGER,
                height INTEGER,
                spent INTEGER DEFAULT 0,
                spent_height INTEGER,
                spent_txid TEXT
            )
        """)
        
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS addresses (
                address TEXT PRIMARY KEY,
                balance INTEGER DEFAULT 0,
                tx_count INTEGER DEFAULT 0
            )
        """)
        
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS mempool (
                txid TEXT PRIMARY KEY,
                raw TEXT,
                timestamp INTEGER,
                fee INTEGER,
                size INTEGER
            )
        """)
        
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS peers (
                address TEXT PRIMARY KEY,
                last_seen INTEGER,
                height INTEGER,
                version TEXT
            )
        """)
        
        self.conn.commit()
    
    def _load_from_disk(self):
        """Load blockchain from disk"""
        # Load blocks
        self.cursor.execute("SELECT * FROM blocks ORDER BY height ASC")
        rows = self.cursor.fetchall()
        
        for row in rows:
            block = Block(
                height=row['height'],
                hash=row['hash'],
                previous_hash=row['previous_hash'],
                timestamp=row['timestamp'],
                merkle_root=row['merkle_root'],
                nonce=row['nonce'],
                bits=row['bits'],
                difficulty=row['difficulty'],
                version=row['version'],
                reward=row['reward'],
                transactions=[]
            )
            
            # Load transactions for this block
            self.cursor.execute("SELECT * FROM transactions WHERE block_height = ?", (row['height'],))
            tx_rows = self.cursor.fetchall()
            
            for tx_row in tx_rows:
                tx_data = json.loads(tx_row['raw'])
                tx = Transaction.from_dict(tx_data)
                block.transactions.append(tx)
            
            self.blocks.append(block)
        
        # Load UTXO set
        self.cursor.execute("SELECT * FROM utxos WHERE spent = 0")
        for row in self.cursor.fetchall():
            key = f"{row['txid']}:{row['vout']}"
            self.utxo_set[key] = dict(row)
        
        # Load mempool
        self.cursor.execute("SELECT * FROM mempool ORDER BY fee DESC")
        for row in self.cursor.fetchall():
            tx_data = json.loads(row['raw'])
            tx = Transaction.from_dict(tx_data)
            self.mempool.append(tx)
        
        # If no blocks, create genesis
        if not self.blocks:
            self._create_genesis_block()
    
    def _create_genesis_block(self):
        """Create the genesis block"""
        print("Creating genesis block...")
        
        # Genesis transaction (coinbase)
        genesis_tx = Transaction(
            txid="",
            version=1,
            type=TransactionType.COINBASE,
            inputs=[{
                "txid": "0"*64,
                "vout": 0,
                "scriptSig": "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f"
            }],
            outputs=[
                # Foundation
                {"address": "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ", "amount": 100001000 * 10**8},
                # Nations (simplified - just a few for genesis)
                {"address": "1HseN7PvuhYMpUr2kmY1YxSAk9adDKGFn5", "amount": 25000000 * 10**8},
                {"address": "19gaibE2WJkaqw3aeDoetp8cNv3k2D1hsH", "amount": 20000000 * 10**8},
                {"address": "121Uzd7JxwgVDHgfA6BbBHavchcFm5Fo5s", "amount": 18000000 * 10**8},
                {"address": "1GiKgvhYCQemji4yLNdLyzmnGmyNCkh3Dg", "amount": 15000000 * 10**8},
                # Whales
                {"address": "1E7ZNdUHo2PF2xGZiRfZUcxuiSaKJ5xo8k", "amount": 8000000 * 10**8},
            ],
            timestamp=1771545600,  # 2026-02-19
            fee=0
        )
        genesis_tx.txid = genesis_tx.calculate_hash()
        
        # Create genesis block
        genesis = Block(
            height=0,
            hash="",
            previous_hash="0"*64,
            timestamp=1771545600,
            transactions=[genesis_tx],
            merkle_root="",
            nonce=2083236893,
            bits="1d00ffff",
            difficulty=1,
            version=1,
            reward=0
        )
        genesis.merkle_root = genesis.calculate_merkle_root()
        genesis.hash = genesis.calculate_hash()
        
        # Add to chain
        self.blocks.append(genesis)
        self._add_block_to_db(genesis)
        
        # Add UTXOs from genesis
        for vout, output in enumerate(genesis_tx.outputs):
            key = f"{genesis_tx.txid}:{vout}"
            self.utxo_set[key] = {
                'txid': genesis_tx.txid,
                'vout': vout,
                'address': output['address'],
                'amount': output['amount'],
                'height': 0,
                'spent': 0
            }
            
            self.cursor.execute("""
                INSERT INTO utxos (outpoint, txid, vout, address, amount, height, spent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (key, genesis_tx.txid, vout, output['address'], output['amount'], 0, 0))
            
            # Update address balance
            self.cursor.execute("""
                INSERT OR REPLACE INTO addresses (address, balance, tx_count)
                VALUES (?, COALESCE((SELECT balance FROM addresses WHERE address = ?), 0) + ?, 
                        COALESCE((SELECT tx_count FROM addresses WHERE address = ?), 0) + 1)
            """, (output['address'], output['address'], output['amount'], output['address']))
        
        self.conn.commit()
        print(f"Genesis block created: {genesis.hash}")
    
    def _add_block_to_db(self, block: Block):
        """Add block to database"""
        self.cursor.execute("""
            INSERT OR REPLACE INTO blocks 
            (height, hash, previous_hash, timestamp, merkle_root, nonce, bits, difficulty, version, reward)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (block.height, block.hash, block.previous_hash, block.timestamp, 
              block.merkle_root, block.nonce, block.bits, block.difficulty, block.version, block.reward))
        
        for tx in block.transactions:
            self.cursor.execute("""
                INSERT OR REPLACE INTO transactions (txid, block_height, type, timestamp, fee, raw)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (tx.txid, block.height, tx.type.value, tx.timestamp, tx.fee, json.dumps(tx.to_dict())))
        
        self.conn.commit()
    
    # ============================================================
    # TRANSACTION METHODS
    # ============================================================
    
    def create_transaction(self, from_addr: str, to_addr: str, amount: int, 
                          fee: int = 1000, private_key: str = None) -> Optional[Transaction]:
        """Create a new transaction"""
        # Get UTXOs for from_addr
        utxos = self.get_address_utxos(from_addr)
        if not utxos:
            print(f"No UTXOs found for address {from_addr}")
            return None
        
        total_input = 0
        inputs = []
        for utxo in utxos:
            total_input += utxo['amount']
            inputs.append({
                'txid': utxo['txid'],
                'vout': utxo['vout'],
                'address': from_addr
            })
            if total_input >= amount + fee:
                break
        
        if total_input < amount + fee:
            print(f"Insufficient funds: have {total_input}, need {amount + fee}")
            return None
        
        # Create outputs
        outputs = [{'address': to_addr, 'amount': amount}]
        change = total_input - amount - fee
        if change > 0:
            outputs.append({'address': from_addr, 'amount': change})
        
        # Create transaction
        tx = Transaction(
            txid="",
            version=1,
            type=TransactionType.TRANSFER,
            inputs=inputs,
            outputs=outputs,
            fee=fee,
            timestamp=int(time.time())
        )
        tx.txid = tx.calculate_hash()
        
        # Sign transaction (simplified - in production use actual crypto)
        if private_key:
            message = tx.txid.encode()
            tx.signature = hashlib.sha256(message + private_key.encode()).hexdigest()
            tx.pubkey = "placeholder_pubkey"
        
        return tx
    
    def send_transaction(self, tx: Transaction) -> Tuple[bool, str]:
        """Send a transaction to the network"""
        # Validate transaction
        valid, msg = tx.validate(self.utxo_set)
        if not valid:
            return False, msg
        
        # Add to mempool
        with self.chain_lock:
            self.mempool.append(tx)
            
            # Add to mempool database
            self.cursor.execute("""
                INSERT OR REPLACE INTO mempool (txid, raw, timestamp, fee, size)
                VALUES (?, ?, ?, ?, ?)
            """, (tx.txid, json.dumps(tx.to_dict()), tx.timestamp, tx.fee, len(json.dumps(tx.to_dict()))))
            self.conn.commit()
        
        # Broadcast to peers (simplified)
        self._broadcast_transaction(tx)
        
        return True, f"Transaction {tx.txid} added to mempool"
    
    def _broadcast_transaction(self, tx: Transaction):
        """Broadcast transaction to peers"""
        # In production, would send to connected peers
        pass
    
    # ============================================================
    # MINING METHODS
    # ============================================================
    
    def start_mining(self, address: str):
        """Start mining"""
        if self.is_mining:
            print("Mining already in progress")
            return
        
        self.is_mining = True
        self.mining_address = address
        self.mining_thread = threading.Thread(target=self._mine_loop)
        self.mining_thread.daemon = True
        self.mining_thread.start()
        print(f"Mining started for address {address}")
    
    def stop_mining(self):
        """Stop mining"""
        self.is_mining = False
        if self.mining_thread:
            self.mining_thread.join(timeout=5)
        print("Mining stopped")
    
    def _mine_loop(self):
        """Main mining loop"""
        while self.is_mining:
            # Create new block
            block = self._create_block(self.mining_address)
            
            # Mine the block
            print(f"Mining block {block.height}...")
            if block.mine(self.target):
                # Add to chain
                if self.add_block(block):
                    print(f"✅ Block {block.height} mined: {block.hash}")
                    
                    # Update reward for next block
                    if block.height % self.halving_interval == 0:
                        self.block_reward //= 2
                else:
                    print(f"❌ Block rejected, restarting mining")
            else:
                print(f"Failed to mine block {block.height}")
    
    def _create_block(self, coinbase_address: str) -> Block:
        """Create a new block for mining"""
        with self.chain_lock:
            prev_block = self.blocks[-1]
            height = prev_block.height + 1
            
            # Create coinbase transaction
            coinbase_tx = Transaction(
                txid="",
                version=1,
                type=TransactionType.COINBASE,
                inputs=[{
                    "txid": "0"*64,
                    "vout": height,
                    "scriptSig": f"Mined by ABR at height {height}"
                }],
                outputs=[{"address": coinbase_address, "amount": self.block_reward}],
                timestamp=int(time.time()),
                fee=0
            )
            coinbase_tx.txid = coinbase_tx.calculate_hash()
            
            # Get transactions from mempool (up to 1000)
            transactions = [coinbase_tx]
            total_size = len(json.dumps(coinbase_tx.to_dict()))
            
            for tx in self.mempool[:]:
                tx_size = len(json.dumps(tx.to_dict()))
                if total_size + tx_size < 1_000_000:  # 1MB limit
                    transactions.append(tx)
                    total_size += tx_size
            
            # Create block
            block = Block(
                height=height,
                hash="",
                previous_hash=prev_block.hash,
                timestamp=int(time.time()),
                transactions=transactions,
                merkle_root="",
                nonce=0,
                bits="1d00ffff",
                difficulty=self.difficulty,
                version=1,
                reward=self.block_reward
            )
            block.merkle_root = block.calculate_merkle_root()
            
            return block
    
    def add_block(self, block: Block) -> bool:
        """Add a validated block to the chain"""
        with self.chain_lock:
            # Validate block
            if not self._validate_block(block):
                return False
            
            # Add to chain
            self.blocks.append(block)
            self._add_block_to_db(block)
            
            # Update UTXO set
            for tx in block.transactions:
                # Remove inputs from UTXO set
                if tx.type != TransactionType.COINBASE:
                    for inp in tx.inputs:
                        key = f"{inp['txid']}:{inp['vout']}"
                        if key in self.utxo_set:
                            del self.utxo_set[key]
                            self.cursor.execute("UPDATE utxos SET spent = 1 WHERE outpoint = ?", (key,))
                
                # Add outputs to UTXO set
                for vout, output in enumerate(tx.outputs):
                    key = f"{tx.txid}:{vout}"
                    self.utxo_set[key] = {
                        'txid': tx.txid,
                        'vout': vout,
                        'address': output['address'],
                        'amount': output['amount'],
                        'height': block.height,
                        'spent': 0
                    }
                    
                    self.cursor.execute("""
                        INSERT INTO utxos (outpoint, txid, vout, address, amount, height, spent)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (key, tx.txid, vout, output['address'], output['amount'], block.height, 0))
                    
                    # Update address balance
                    self.cursor.execute("""
                        INSERT OR REPLACE INTO addresses (address, balance, tx_count)
                        VALUES (?, COALESCE((SELECT balance FROM addresses WHERE address = ?), 0) + ?, 
                                COALESCE((SELECT tx_count FROM addresses WHERE address = ?), 0) + 1)
                    """, (output['address'], output['address'], output['amount'], output['address']))
            
            # Remove transactions from mempool
            for tx in block.transactions[1:]:  # Skip coinbase
                if tx in self.mempool:
                    self.mempool.remove(tx)
                    self.cursor.execute("DELETE FROM mempool WHERE txid = ?", (tx.txid,))
            
            self.conn.commit()
            self.new_block_event.set()
            
            return True
    
    def _validate_block(self, block: Block) -> bool:
        """Validate a block"""
        # Check previous hash
        if block.height > 0 and block.previous_hash != self.blocks[-1].hash:
            return False
        
        # Check timestamp
        if block.timestamp > int(time.time()) + 7200:  # 2 hours in future
            return False
        
        # Check merkle root
        if block.merkle_root != block.calculate_merkle_root():
            return False
        
        # Check proof of work
        if int(block.hash, 16) >= self.target:
            return False
        
        # Validate transactions
        for tx in block.transactions[1:]:  # Skip coinbase
            valid, _ = tx.validate(self.utxo_set)
            if not valid:
                return False
        
        return True
    
    # ============================================================
    # QUERY METHODS
    # ============================================================
    
    def get_balance(self, address: str) -> int:
        """Get balance for an address"""
        self.cursor.execute("SELECT balance FROM addresses WHERE address = ?", (address,))
        row = self.cursor.fetchone()
        return row['balance'] if row else 0
    
    def get_address_utxos(self, address: str) -> List[Dict]:
        """Get UTXOs for an address"""
        utxos = []
        for key, utxo in self.utxo_set.items():
            if utxo['address'] == address and not utxo.get('spent', 0):
                utxos.append(utxo)
        return utxos
    
    def get_transaction(self, txid: str) -> Optional[Transaction]:
        """Get transaction by ID"""
        self.cursor.execute("SELECT raw FROM transactions WHERE txid = ?", (txid,))
        row = self.cursor.fetchone()
        if row:
            return Transaction.from_dict(json.loads(row['raw']))
        
        # Check mempool
        self.cursor.execute("SELECT raw FROM mempool WHERE txid = ?", (txid,))
        row = self.cursor.fetchone()
        if row:
            return Transaction.from_dict(json.loads(row['raw']))
        
        return None
    
    def get_block(self, height: int = None, hash: str = None) -> Optional[Block]:
        """Get block by height or hash"""
        if height is not None and 0 <= height < len(self.blocks):
            return self.blocks[height]
        
        if hash:
            for block in self.blocks:
                if block.hash == hash:
                    return block
        
        return None
    
    def get_blockchain_info(self) -> Dict:
        """Get blockchain information"""
        return {
            "chain": self.network,
            "blocks": len(self.blocks),
            "headers": len(self.blocks),
            "bestblockhash": self.blocks[-1].hash if self.blocks else "",
            "difficulty": self.difficulty,
            "mediantime": self.blocks[-1].timestamp if self.blocks else 0,
            "verificationprogress": 1.0,
            "initialblockdownload": False,
            "chainwork": hex(len(self.blocks)),
            "size_on_disk": os.path.getsize(f"{self.data_dir}/chain.db") if os.path.exists(f"{self.data_dir}/chain.db") else 0,
            "pruned": False,
            "softforks": {},
            "warnings": ""
        }
    
    def get_mempool_info(self) -> Dict:
        """Get mempool information"""
        total_size = sum(len(json.dumps(tx.to_dict())) for tx in self.mempool)
        return {
            "size": len(self.mempool),
            "bytes": total_size,
            "usage": total_size,
            "maxmempool": 300000000,
            "mempoolminfee": 0.00001000
        }
    
    def get_txoutset_info(self) -> Dict:
        """Get UTXO set information"""
        total_amount = sum(utxo['amount'] for utxo in self.utxo_set.values())
        return {
            "height": len(self.blocks) - 1,
            "bestblock": self.blocks[-1].hash if self.blocks else "",
            "transactions": len(self.utxo_set),
            "txouts": len(self.utxo_set),
            "total_amount": total_amount / 10**8,
            "disk_size": len(str(self.utxo_set))
        }

# ============================================================
# WALLET CLASS
# ============================================================

class Wallet:
    def __init__(self, data_dir: str = "~/.abr/wallets"):
        self.data_dir = os.path.expanduser(data_dir)
        os.makedirs(self.data_dir, exist_ok=True)
        self.wallets = {}
        self.current_wallet = None
        self._load_wallets()
    
    def _load_wallets(self):
        """Load wallets from disk"""
        wallet_file = f"{self.data_dir}/wallets.json"
        if os.path.exists(wallet_file):
            with open(wallet_file, 'r') as f:
                self.wallets = json.load(f)
    
    def _save_wallets(self):
        """Save wallets to disk"""
        with open(f"{self.data_dir}/wallets.json", 'w') as f:
            json.dump(self.wallets, f, indent=2)
    
    def create_wallet(self, name: str) -> Dict:
        """Create a new wallet"""
        import secrets
        from hashlib import sha256
        
        # Generate private key (simplified - in production use proper crypto)
        private_key = secrets.token_hex(32)
        
        # Generate public key (simplified)
        public_key = sha256(private_key.encode()).hexdigest()
        
        # Generate address (simplified)
        address = "1" + sha256(public_key.encode()).hexdigest()[:34]
        
        wallet = {
            "name": name,
            "address": address,
            "public_key": public_key,
            "private_key": private_key,
            "created": int(time.time())
        }
        
        self.wallets[name] = wallet
        self.current_wallet = name
        self._save_wallets()
        
        return wallet
    
    def get_address(self, name: str = None) -> Optional[str]:
        """Get address for wallet"""
        if name is None:
            name = self.current_wallet
        if name in self.wallets:
            return self.wallets[name]['address']
        return None
    
    def list_wallets(self) -> List[str]:
        """List all wallets"""
        return list(self.wallets.keys())
    
    def get_wallet_info(self, name: str = None) -> Optional[Dict]:
        """Get wallet information"""
        if name is None:
            name = self.current_wallet
        return self.wallets.get(name)

# ============================================================
# MAIN FUNCTION
# ============================================================

if __name__ == "__main__":
    # Test the blockchain
    print("Testing ABR Blockchain...")
    
    # Create blockchain (testnet)
    chain = Blockchain(network="testnet")
    
    # Create wallet
    wallet = Wallet()
    test_wallet = wallet.create_wallet("test1")
    print(f"Created wallet: {test_wallet['address']}")
    
    # Check genesis balance
    genesis_addr = "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ"
    balance = chain.get_balance(genesis_addr)
    print(f"Genesis balance: {balance / 10**8} ABR")
    
    # Create transaction
    tx = chain.create_transaction(
        from_addr=genesis_addr,
        to_addr=test_wallet['address'],
        amount=1000 * 10**8,  # 1000 ABR
        fee=1000,
        private_key="test_key"
    )
    
    if tx:
        result, msg = chain.send_transaction(tx)
        print(f"Transaction: {msg}")
        
        # Start mining
        chain.start_mining(test_wallet['address'])
        
        # Let it mine for a bit
        import time
        time.sleep(10)
        
        # Stop mining
        chain.stop_mining()
        
        # Check new balance
        new_balance = chain.get_balance(test_wallet['address'])
        print(f"New wallet balance: {new_balance / 10**8} ABR")
    
    print("Blockchain info:", chain.get_blockchain_info())
