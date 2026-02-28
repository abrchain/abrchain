from flask import Flask, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

GENESIS_HASH = "3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7"

# Load your genesis data from existing files
with open('GENESIS_README.txt', 'r') as f:
    genesis_message = f.read()

@app.route('/protocol/info')
def protocol_info():
    return jsonify({
        "version": 1,
        "network": "mainnet",
        "total_supply": 1000000000,
        "genesis_supply": 517851000,
        "protocol_hash": GENESIS_HASH,
        "immutable": True,
        "genesis_message": genesis_message[:100]
    })

@app.route('/protocol/hash')
def protocol_hash():
    return jsonify({"protocol_hash": GENESIS_HASH})

@app.route('/protocol/validate/<address>')
def validate_address(address):
    # Check against your genesis addresses
    # You can parse this from your genesis files
    genesis_addresses = {
        "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ": "foundation",
        "1HseN7PvuhYMpUr2kmY1YxSAk9adDKGFn5": "central_banks"
    }
    
    if address in genesis_addresses:
        return jsonify({
            "valid": True,
            "category": genesis_addresses[address],
            "amount": 10000000
        })
    return jsonify({"valid": False})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8345, debug=True)
