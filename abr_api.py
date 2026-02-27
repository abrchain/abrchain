#!/usr/bin/env python3
"""
ABR Blockchain API Wrapper
Provides easy access to blockchain functions for all projects
"""

import subprocess
import json
import sqlite3
import os
from datetime import datetime

class ABR_API:
    def __init__(self):
        self.home = os.path.expanduser("~")
        self.db_path = f"{self.home}/.abr/mainnet/utxo.db"
        self.abr_cmd = f"{self.home}/abr-project/src/abr-core/abr"
        
    def get_genesis(self):
        """Get genesis block information"""
        result = subprocess.run([self.abr_cmd, "getgenesis"], 
                               capture_output=True, text=True)
        return result.stdout
    
    def check_db(self):
        """Check UTXO database status"""
        result = subprocess.run([self.abr_cmd, "checkdb"], 
                               capture_output=True, text=True)
        return result.stdout
    
    def get_balance(self, address):
        """Get balance for an address (simplified)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(amount_abr) FROM utxos WHERE address=? AND spent=0", 
                      (address,))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result[0] else 0
    
    def get_nation_allocation(self, nation_code):
        """Get allocation for a specific nation"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT SUM(amount_abr) FROM utxos 
            WHERE purpose LIKE ? AND spent=0
        """, (f"%{nation_code}%",))
        result = cursor.fetchone()
        conn.close()
        return result[0] if result[0] else 0
    
    def get_total_supply(self):
        """Get total supply"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT SUM(amount_abr) FROM utxos")
        result = cursor.fetchone()
        conn.close()
        return result[0] if result[0] else 0
    
    def get_utxo_count(self):
        """Get total number of UTXOs"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM utxos")
        result = cursor.fetchone()
        conn.close()
        return result[0]
    
    def get_top_addresses(self, limit=10):
        """Get top addresses by balance"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT address, SUM(amount_abr) as total 
            FROM utxos GROUP BY address 
            ORDER BY total DESC LIMIT ?
        """, (limit,))
        results = cursor.fetchall()
        conn.close()
        return results

# Example usage
if __name__ == "__main__":
    abr = ABR_API()
    print("=== ABR Blockchain Status ===")
    print(f"Total UTXOs: {abr.get_utxo_count()}")
    print(f"Total Supply: {abr.get_total_supply():,.0f} ABR")
    print(f"Genesis Foundation: {abr.get_balance('1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ'):,.0f} ABR")
    print(f"Nigeria Allocation: {abr.get_nation_allocation('NG'):,.0f} ABR")
