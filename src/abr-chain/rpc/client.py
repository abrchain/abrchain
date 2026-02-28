#!/usr/bin/env python3
"""
ABR Chain RPC Client
"""
import json
import requests
from typing import Any, Dict, List, Optional

class ABRClient:
    def __init__(self, host='127.0.0.1', port=9332, user='abr', password='abr'):
        self.url = f"http://{host}:{port}"
        self.auth = (user, password)
    
    def call(self, method: str, params: List = None) -> Any:
        """Call RPC method"""
        if params is None:
            params = []
        
        payload = {
            "jsonrpc": "1.0",
            "id": 1,
            "method": method,
            "params": params
        }
        
        try:
            response = requests.post(self.url, json=payload, auth=self.auth, timeout=30)
            if response.status_code == 200:
                result = response.json()
                if result.get('error'):
                    raise Exception(result['error'])
                return result.get('result')
            else:
                raise Exception(f"HTTP Error {response.status_code}")
        except Exception as e:
            raise Exception(f"RPC call failed: {e}")
    
    # Blockchain methods
    def get_blockchain_info(self) -> Dict:
        return self.call('getblockchaininfo')
    
    def get_block_count(self) -> int:
        return self.call('getblockcount')
    
    def get_block_hash(self, height: int) -> str:
        return self.call('getblockhash', [height])
    
    def get_block(self, block_hash: str) -> Dict:
        return self.call('getblock', [block_hash])
    
    def get_mempool_info(self) -> Dict:
        return self.call('getmempoolinfo')
    
    def get_txoutset_info(self) -> Dict:
        return self.call('gettxoutsetinfo')
    
    # Wallet methods
    def get_balance(self, address: str) -> float:
        return self.call('getbalance', [address])
    
    def get_new_address(self, wallet_name: str = None) -> str:
        if wallet_name:
            return self.call('getnewaddress', [wallet_name])
        return self.call('getnewaddress')
    
    def list_wallets(self) -> List[str]:
        return self.call('listwallets')
    
    def get_wallet_info(self, wallet_name: str = None) -> Dict:
        if wallet_name:
            return self.call('getwalletinfo', [wallet_name])
        return self.call('getwalletinfo')
    
    # Transaction methods
    def create_raw_transaction(self, from_addr: str, to_addr: str, amount: float, fee: float = 0.00001) -> Dict:
        return self.call('createrawtransaction', [from_addr, to_addr, amount, int(fee * 10**8)])
    
    def send_transaction(self, tx_data: Dict) -> Dict:
        return self.call('sendtransaction', [tx_data])
    
    # Mining methods
    def start_mining(self, address: str):
        return self.call('startmining', [address])
    
    def stop_mining(self):
        return self.call('stopmining')

# Example usage
if __name__ == "__main__":
    client = ABRClient()
    
    # Get blockchain info
    info = client.get_blockchain_info()
    print(f"Blockchain: {info}")
    
    # Get new address
    addr = client.get_new_address("test")
    print(f"New address: {addr}")
