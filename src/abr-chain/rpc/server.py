#!/usr/bin/env python3
"""
ABR Chain RPC Server
"""
import sys
import os
import json
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.blockchain import Blockchain, Wallet

class RPCRequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            req = json.loads(post_data.decode())
            method = req.get('method', '')
            params = req.get('params', [])
            req_id = req.get('id', 1)
            
            # Handle RPC methods
            if method == 'getblockchaininfo':
                result = self.server.chain.get_blockchain_info()
                self.send_response(200, result, req_id)
            elif method == 'getblockcount':
                result = len(self.server.chain.blocks)
                self.send_response(200, result, req_id)
            elif method == 'getblockhash':
                height = params[0] if params else 0
                block = self.server.chain.get_block(height=height)
                result = block.hash if block else None
                self.send_response(200, result, req_id)
            elif method == 'getblock':
                block_hash = params[0] if params else ''
                block = self.server.chain.get_block(hash=block_hash)
                result = block.to_dict() if block else None
                self.send_response(200, result, req_id)
            elif method == 'getbalance':
                address = params[0] if params else ''
                result = self.server.chain.get_balance(address) / 10**8
                self.send_response(200, result, req_id)
            elif method == 'sendtransaction':
                tx_data = params[0] if params else {}
                from core.blockchain import Transaction
                tx = Transaction.from_dict(tx_data)
                success, msg = self.server.chain.send_transaction(tx)
                self.send_response(200, {"success": success, "message": msg}, req_id)
            elif method == 'createrawtransaction':
                from_addr = params[0] if len(params) > 0 else ''
                to_addr = params[1] if len(params) > 1 else ''
                amount = params[2] if len(params) > 2 else 0
                fee = params[3] if len(params) > 3 else 1000
                tx = self.server.chain.create_transaction(from_addr, to_addr, amount * 10**8, fee)
                result = tx.to_dict() if tx else None
                self.send_response(200, result, req_id)
            elif method == 'getmempoolinfo':
                result = self.server.chain.get_mempool_info()
                self.send_response(200, result, req_id)
            elif method == 'gettxoutsetinfo':
                result = self.server.chain.get_txoutset_info()
                self.send_response(200, result, req_id)
            elif method == 'getnewaddress':
                wallet_name = params[0] if params else f"wallet_{int(time.time())}"
                wallet = self.server.wallet.create_wallet(wallet_name)
                result = wallet['address']
                self.send_response(200, result, req_id)
            elif method == 'listwallets':
                result = self.server.wallet.list_wallets()
                self.send_response(200, result, req_id)
            elif method == 'getwalletinfo':
                wallet_name = params[0] if params else None
                result = self.server.wallet.get_wallet_info(wallet_name)
                self.send_response(200, result, req_id)
            elif method == 'startmining':
                address = params[0] if params else ''
                threading.Thread(target=self.server.chain.start_mining, args=(address,)).start()
                self.send_response(200, "Mining started", req_id)
            elif method == 'stopmining':
                self.server.chain.stop_mining()
                self.send_response(200, "Mining stopped", req_id)
            else:
                self.send_response(404, f"Method {method} not found", req_id)
                
        except Exception as e:
            self.send_response(500, str(e), req_id)
    
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/health':
            self.send_response(200, {"status": "healthy"})
        else:
            self.send_response(404, "Not found")
    
    def send_response(self, code, result, req_id=None):
        self.send_response_only(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        response = {
            'result': result,
            'error': None,
            'id': req_id
        }
        self.wfile.write(json.dumps(response).encode())

class RPCServer(HTTPServer):
    def __init__(self, server_address, RequestHandlerClass, network='testnet'):
        super().__init__(server_address, RequestHandlerClass)
        self.chain = Blockchain(network=network)
        self.wallet = Wallet()
        print(f"RPC Server started on {server_address[0]}:{server_address[1]}")
        print(f"Network: {network}")
        print(f"Blocks: {len(self.chain.blocks)}")
        print(f"Genesis: {self.chain.blocks[0].hash if self.chain.blocks else 'None'}")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='ABR Chain RPC Server')
    parser.add_argument('--port', type=int, default=9332, help='RPC port')
    parser.add_argument('--network', choices=['mainnet', 'testnet'], default='testnet', help='Network')
    parser.add_argument('--host', default='127.0.0.1', help='Bind address')
    args = parser.parse_args()
    
    server = RPCServer((args.host, args.port), RPCRequestHandler, args.network)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.chain.stop_mining()
        server.shutdown()

if __name__ == '__main__':
    main()
