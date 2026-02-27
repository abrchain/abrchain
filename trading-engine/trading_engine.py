#!/usr/bin/env python3
"""
Trading Engine - Simple version
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'shared', 'protocol-client'))
from protocol_client import protocol_client

app = Flask(__name__)
CORS(app)

@app.route('/api/v1/trade', methods=['POST'])
def execute_trade():
    data = request.json
    
    # Simple validation
    if not data or 'amount' not in data:
        return jsonify({"error": "Missing amount"}), 400
    
    # Check against max supply
    summary = protocol_client.get_summary()
    if data['amount'] > summary.get('total_supply', 0):
        return jsonify({"error": "Amount exceeds max supply"}), 400
    
    # Check if address is genesis (special handling)
    if 'address' in data:
        addr_check = protocol_client.validate_address(data['address'])
        is_genesis = addr_check.get('valid', False)
    else:
        is_genesis = False
    
    return jsonify({
        "success": True,
        "trade_id": f"TRADE-{os.urandom(4).hex()}",
        "amount": data['amount'],
        "is_genesis": is_genesis,
        "protocol_hash": protocol_client.get_protocol_hash()
    })

@app.route('/api/v1/info', methods=['GET'])
def get_info():
    return jsonify({
        "name": "ABR Trading Engine",
        "version": "1.0",
        "protocol": protocol_client.get_protocol_hash()
    })

if __name__ == '__main__':
    print("🚀 Trading Engine starting on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)
