#!/usr/bin/env python3
"""
ABR REST API Server
Provides HTTP endpoints for blockchain queries
"""

from flask import Flask, jsonify, request
from abr_api import ABR_API
import json

app = Flask(__name__)
abr = ABR_API()

@app.route('/')
def home():
    return jsonify({
        "service": "ABR Blockchain API",
        "version": "1.0",
        "endpoints": [
            "/genesis",
            "/status",
            "/balance/<address>",
            "/nation/<code>",
            "/top/<int:limit>",
            "/total_supply"
        ]
    })

@app.route('/genesis')
def genesis():
    return jsonify({
        "genesis_hash": "3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7",
        "genesis_txid": "1780952e177d6b42e92ae4df7be0a60ee3cc33a13f3ef437ddea61b4ab86c7bf",
        "genesis_address": "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ",
        "timestamp": 1771545600,
        "message": "Africa Bitcoin Reserve - Genesis Block - February 19, 2026 - United Africa"
    })

@app.route('/status')
def status():
    return jsonify({
        "utxo_count": abr.get_utxo_count(),
        "total_supply": abr.get_total_supply(),
        "genesis_hash": "3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7"
    })

@app.route('/balance/<address>')
def balance(address):
    balance = abr.get_balance(address)
    return jsonify({
        "address": address,
        "balance": balance,
        "balance_abr": f"{balance:,.0f} ABR"
    })

@app.route('/nation/<code>')
def nation(code):
    allocation = abr.get_nation_allocation(code.upper())
    return jsonify({
        "nation_code": code.upper(),
        "allocation": allocation,
        "allocation_abr": f"{allocation:,.0f} ABR"
    })

@app.route('/top/<int:limit>')
def top(limit):
    addresses = abr.get_top_addresses(limit)
    return jsonify([
        {"address": addr, "balance": bal, "balance_abr": f"{bal:,.0f} ABR"}
        for addr, bal in addresses
    ])

@app.route('/total_supply')
def total_supply():
    total = abr.get_total_supply()
    return jsonify({
        "total_supply": total,
        "total_supply_abr": f"{total:,.0f} ABR",
        "pre_mined": 517851000,
        "pre_mined_percent": 51.8
    })

if __name__ == '__main__':
    print("🚀 ABR REST API Server starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
