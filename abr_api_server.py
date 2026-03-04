#!/usr/bin/env python3
"""
ABR Protocol API Server
Main entry point for the ABR REST and WebSocket API
"""

import asyncio
import json
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from abrchain.core.blockchain import Blockchain
from abrchain.core.genesis import GENESIS_HASH, GENESIS_ADDRESS
from abrchain.consensus.validator import Validator
from abrchain.trading_engine.engine import TradingEngine
from abrchain.wallet.wallet import Wallet

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize components
app = FastAPI(
    title="ABR Protocol API",
    description="Africa Bitcoin Reserve - Blockchain API",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
blockchain = Blockchain()
validator = Validator()
trading_engine = TradingEngine()
wallet = Wallet()

# WebSocket connections
active_connections = []

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("Starting ABR Protocol API Server v2.0.0")
    logger.info(f"Genesis Hash: {GENESIS_HASH}")
    await blockchain.initialize()
    await trading_engine.initialize()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down ABR Protocol API Server")
    await blockchain.close()
    await trading_engine.close()

# ===== REST API Endpoints =====

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "ABR Protocol API",
        "version": "2.0.0",
        "genesis_hash": GENESIS_HASH,
        "genesis_address": GENESIS_ADDRESS,
        "status": "operational",
        "documentation": "/docs"
    }

@app.get("/api/v1/info")
async def get_blockchain_info():
    """Get blockchain information"""
    try:
        info = await blockchain.get_info()
        return JSONResponse(content=info)
    except Exception as e:
        logger.error(f"Error getting blockchain info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/block/{block_id}")
async def get_block(block_id: str):
    """Get block by height or hash"""
    try:
        if block_id.isdigit():
            block = await blockchain.get_block_by_height(int(block_id))
        else:
            block = await blockchain.get_block_by_hash(block_id)
        
        if not block:
            raise HTTPException(status_code=404, detail="Block not found")
        
        return JSONResponse(content=block)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting block {block_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/tx/{tx_hash}")
async def get_transaction(tx_hash: str):
    """Get transaction by hash"""
    try:
        tx = await blockchain.get_transaction(tx_hash)
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return JSONResponse(content=tx)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction {tx_hash}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/address/{address}")
async def get_address_info(address: str):
    """Get address information and balance"""
    try:
        info = await blockchain.get_address_info(address)
        if not info:
            raise HTTPException(status_code=404, detail="Address not found")
        return JSONResponse(content=info)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting address info {address}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/send")
async def send_transaction(tx_data: dict):
    """Send a transaction"""
    try:
        result = await blockchain.send_transaction(tx_data)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error sending transaction: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/utxo")
async def get_utxo_info():
    """Get UTXO database information"""
    try:
        info = await blockchain.get_utxo_info()
        return JSONResponse(content=info)
    except Exception as e:
        logger.error(f"Error getting UTXO info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/nations")
async def get_nation_supply():
    """Get nation supply information"""
    try:
        supply = await blockchain.get_nation_supply()
        return JSONResponse(content=supply)
    except Exception as e:
        logger.error(f"Error getting nation supply: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/genesis")
async def get_genesis_info():
    """Get genesis block information"""
    return {
        "genesis_hash": GENESIS_HASH,
        "genesis_address": GENESIS_ADDRESS,
        "genesis_txid": "1780952e177d6b42e92ae4df7be0a60ee3cc33a13f3ef437ddea61b4ab86c7bf",
        "timestamp": 1771545600,
        "message": "Africa Bitcoin Reserve - Genesis Block - February 19, 2026 - United Africa",
        "total_supply": 1000000000,
        "premined": 517851000,
        "premine_percentage": 51.7851,
        "nation_supply": 146000000
    }

@app.get("/api/v1/peers")
async def get_peers():
    """Get connected peers"""
    try:
        peers = await blockchain.get_peers()
        return JSONResponse(content={"peers": peers, "count": len(peers)})
    except Exception as e:
        logger.error(f"Error getting peers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/peer/add")
async def add_peer(peer_data: dict):
    """Add a peer node"""
    try:
        result = await blockchain.add_peer(peer_data.get("address"), peer_data.get("port", 8333))
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error adding peer: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ===== Trading Engine Endpoints =====

@app.get("/api/v1/orderbook")
async def get_orderbook(symbol: str = "ABR/USD"):
    """Get orderbook for a trading pair"""
    try:
        orderbook = await trading_engine.get_orderbook(symbol)
        return JSONResponse(content=orderbook)
    except Exception as e:
        logger.error(f"Error getting orderbook: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/order")
async def place_order(order_data: dict):
    """Place a new order"""
    try:
        result = await trading_engine.place_order(order_data)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error placing order: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/order/{order_id}")
async def cancel_order(order_id: str):
    """Cancel an order"""
    try:
        result = await trading_engine.cancel_order(order_id)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error canceling order: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/trades")
async def get_recent_trades(symbol: str = "ABR/USD", limit: int = 100):
    """Get recent trades"""
    try:
        trades = await trading_engine.get_recent_trades(symbol, limit)
        return JSONResponse(content=trades)
    except Exception as e:
        logger.error(f"Error getting trades: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== WebSocket Endpoints =====

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    active_connections.append(websocket)
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "genesis_hash": GENESIS_HASH,
            "timestamp": asyncio.get_event_loop().time()
        })
        
        # Handle incoming messages
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                if message.get("type") == "subscribe":
                    channel = message.get("channel")
                    if channel in ["blocks", "transactions", "trades"]:
                        # Handle subscription
                        await websocket.send_json({
                            "type": "subscribed",
                            "channel": channel,
                            "status": "success"
                        })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Invalid channel: {channel}"
                        })
                
                elif message.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": asyncio.get_event_loop().time()})
                
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
    
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        logger.info("WebSocket client disconnected")

# Broadcast functions (called by other components)
async def broadcast_new_block(block_data: dict):
    """Broadcast new block to all connected WebSocket clients"""
    message = {
        "type": "new_block",
        "data": block_data,
        "timestamp": asyncio.get_event_loop().time()
    }
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            pass  # Connection might be closed

async def broadcast_new_transaction(tx_data: dict):
    """Broadcast new transaction to all connected WebSocket clients"""
    message = {
        "type": "new_transaction",
        "data": tx_data,
        "timestamp": asyncio.get_event_loop().time()
    }
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except:
            pass

# ===== CLI Commands =====

@app.get("/cli/genesis")
async def cli_genesis():
    """CLI-style genesis block output"""
    return {
        "command": "abr-cli getgenesisblock",
        "output": f"""
🌟 GENESIS BLOCK
----------------------------------------
Genesis Hash:      {GENESIS_HASH}
Genesis TXID:      1780952e177d6b42e92ae4df7be0a60ee3cc33a13f3ef437ddea61b4ab86c7bf
Genesis Address:   {GENESIS_ADDRESS}
Genesis Timestamp: 1771545600 (2026-02-19 12:00:00 UTC)
Genesis Message:   "Africa Bitcoin Reserve - Genesis Block - February 19, 2026 - United Africa"
Total Supply:      1,000,000,000 ABR
Pre-mined:         517,851,000 ABR (51%)
"""
    }

@app.get("/cli/utxo")
async def cli_utxo():
    """CLI-style UTXO output"""
    info = await blockchain.get_utxo_info()
    return {
        "command": "abr-cli gettxoutsetinfo",
        "output": f"""
🗄️  UTXO DATABASE CHECK
----------------------------------------
📊 Total UTXOs in database: {info.get('total_utxos', 155)}
💰 Total Value: {info.get('total_value', 517851000):,} ABR
🌟 Genesis Hash: {GENESIS_HASH[:16]}...{GENESIS_HASH[-4:]}
"""
    }

# ===== Main Entry Point =====

if __name__ == "__main__":
    uvicorn.run(
        "abr_api_server:app",
        host="0.0.0.0",
        port=8332,
        reload=True,
        log_level="info"
    )
