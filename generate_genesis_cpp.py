#!/usr/bin/env python3
"""
ABR Protocol Genesis C++ Generator
Generates C++ header files with genesis block constants
"""

import hashlib
from datetime import datetime

# Genesis block constants
GENESIS_HASH = "3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7"
GENESIS_TXID = "1780952e177d6b42e92ae4df7be0a60ee3cc33a13f3ef437ddea61b4ab86c7bf"
GENESIS_ADDRESS = "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ"
GENESIS_TIMESTAMP = 1771545600
GENESIS_MESSAGE = "Africa Bitcoin Reserve - Genesis Block - February 19, 2026 - United Africa"
TOTAL_SUPPLY = 1000000000
PREMINE = 517851000
NATION_SUPPLY = 146000000
BLOCK_TIME = 120
INITIAL_REWARD = 50

def generate_genesis_h():
    """Generate genesis.h C++ header"""
    return f'''#ifndef ABR_GENESIS_H
#define ABR_GENESIS_H

#include <cstdint>
#include <string>

namespace abr {{

/**
 * @file genesis.h
 * @brief ABR Protocol Genesis Block Constants
 * 
 * Immutable genesis block parameters.
 * Genesis Hash: {GENESIS_HASH}
 * Timestamp: {datetime.utcfromtimestamp(GENESIS_TIMESTAMP).strftime('%Y-%m-%d %H:%M:%S')} UTC
 */

/** Genesis block hash (immutable) */
const std::string GENESIS_HASH = "{GENESIS_HASH}";

/** Genesis transaction ID */
const std::string GENESIS_TXID = "{GENESIS_TXID}";

/** Genesis address (foundation) */
const std::string GENESIS_ADDRESS = "{GENESIS_ADDRESS}";

/** Genesis timestamp (UNIX) */
const uint64_t GENESIS_TIMESTAMP = {GENESIS_TIMESTAMP};

/** Genesis message */
const std::string GENESIS_MESSAGE = "{GENESIS_MESSAGE}";

/** Total supply (fixed forever) */
const uint64_t TOTAL_SUPPLY = {TOTAL_SUPPLY};

/** Genesis supply (pre-mined) */
const uint64_t GENESIS_SUPPLY = {PREMINE};

/** Mining reserve (to be mined) */
const uint64_t MINING_RESERVE = TOTAL_SUPPLY - GENESIS_SUPPLY;

/** Nation allocation */
const uint64_t NATION_SUPPLY = {NATION_SUPPLY};

/** Block time in seconds */
const uint32_t BLOCK_TIME = {BLOCK_TIME};

/** Initial block reward */
const uint64_t INITIAL_BLOCK_REWARD = {INITIAL_REWARD};

/** Halving interval (blocks) */
const uint32_t HALVING_INTERVAL = 840000;

/** Minimum reserve ratio (percentage * 100) */
const uint32_t MIN_RESERVE_RATIO = 10500;  // 105.00%

/** Maximum block size */
const uint32_t MAX_BLOCK_SIZE = 4 * 1024 * 1024;  // 4 MB

/** Address prefix for Bech32 */
const std::string ADDRESS_PREFIX = "abr";

/** Network magic bytes */
const uint32_t NETWORK_MAGIC = 0xabcfabcd;

/**
 * @brief Verify genesis block integrity
 * @return true if genesis matches, false otherwise
 */
inline bool verify_genesis(const std::string& hash) {{
    return hash == GENESIS_HASH;
}}

}} // namespace abr

#endif // ABR_GENESIS_H
'''

def generate_genesis_cpp():
    """Generate genesis.cpp C++ implementation"""
    return f'''#include "genesis.h"
#include <iostream>
#include <iomanip>

namespace abr {{

void print_genesis_info() {{
    std::cout << "╔═══════════════════════════════════════════════════════════════════╗\\n";
    std::cout << "║                                                                   ║\\n";
    std::cout << "║              AFRICA BITCOIN RESERVE - GENESIS BLOCK              ║\\n";
    std::cout << "║                         v2.0.0 - IMMUTABLE                       ║\\n";
    std::cout << "║                                                                   ║\\n";
    std::cout << "╚═══════════════════════════════════════════════════════════════════╝\\n";
    std::cout << "\\n";
    std::cout << "Genesis Hash:      " << GENESIS_HASH << "\\n";
    std::cout << "Genesis TXID:      " << GENESIS_TXID << "\\n";
    std::cout << "Genesis Address:   " << GENESIS_ADDRESS << "\\n";
    std::cout << "Timestamp:         " << GENESIS_TIMESTAMP << " ("
              << std::put_time(std::gmtime(&GENESIS_TIMESTAMP), "%Y-%m-%d %H:%M:%S") << " UTC)\\n";
    std::cout << "Message:           \\"" << GENESIS_MESSAGE << "\\"\\n";
    std::cout << "Total Supply:      " << TOTAL_SUPPLY << " ABR\\n";
    std::cout << "Pre-mined:         " << GENESIS_SUPPLY << " ABR ("
              << (GENESIS_SUPPLY * 100.0 / TOTAL_SUPPLY) << "%)\\n";
    std::cout << "Mining Reserve:    " << MINING_RESERVE << " ABR ("
              << (MINING_RESERVE * 100.0 / TOTAL_SUPPLY) << "%)\\n";
    std::cout << "Nation Supply:     " << NATION_SUPPLY << " ABR\\n";
    std::cout << "Block Time:        " << BLOCK_TIME << " seconds\\n";
    std::cout << "Block Reward:      " << INITIAL_BLOCK_REWARD << " ABR\\n";
    std::cout << "================================================================\\n";
}}

}} // namespace abr
'''

def generate_consensus_h():
    """Generate consensus.h C++ header"""
    return f'''#ifndef ABR_CONSENSUS_H
#define ABR_CONSENSUS_H

#include <cstdint>
#include "genesis.h"

namespace abr {{

/**
 * @file consensus.h
 * @brief ABR Protocol Consensus Parameters
 */

/** Proof of Work target spacing (blocks) */
const uint32_t POW_TARGET_SPACING = 2016;

/** Difficulty adjustment interval */
const uint32_t DIFFICULTY_ADJUSTMENT_INTERVAL = 2016;

/** Maximum target (minimum difficulty) */
const uint32_t MAX_TARGET = 0x1d00ffff;

/** Minimum target (maximum difficulty) */
const uint32_t MIN_TARGET = 0x1d00ffff >> 4;

/** Coinbase maturity (blocks) */
const uint32_t COINBASE_MATURITY = 100;

/** Maximum signature operations per block */
const uint32_t MAX_BLOCK_SIGOPS = 20000;

/** Maximum transactions per block */
const uint32_t MAX_TRANSACTIONS_PER_BLOCK = 5000;

/** Minimum transaction fee (satoshis) */
const uint64_t MIN_TX_FEE = 1000;

/** Maximum block weight (witness scale) */
const uint32_t MAX_BLOCK_WEIGHT = 4 * 1000 * 1000;

/**
 * @brief Calculate block reward for given height
 * @param height Block height
 * @return Block reward in ABR
 */
inline uint64_t get_block_reward(uint32_t height) {{
    uint64_t reward = INITIAL_BLOCK_REWARD;
    uint32_t halvings = height / HALVING_INTERVAL;
    
    for (uint32_t i = 0; i < halvings && i < 64; ++i) {{
        reward >>= 1;  // Divide by 2 each halving
    }}
    
    return reward;
}}

/**
 * @brief Validate block timestamp
 * @param timestamp Block timestamp
 * @param prev_timestamp Previous block timestamp
 * @param current_time Current network time
 * @return true if timestamp is valid
 */
inline bool validate_timestamp(uint64_t timestamp, 
                               uint64_t prev_timestamp,
                               uint64_t current_time) {{
    // Can't be more than 2 hours in future
    if (timestamp > current_time + 2 * 3600) {{
        return false;
    }}
    
    // Must be after previous block
    if (timestamp <= prev_timestamp) {{
        return false;
    }}
    
    return true;
}}

}} // namespace abr

#endif // ABR_CONSENSUS_H
'''

def main():
    """Generate all C++ header files"""
    print("Generating ABR Protocol C++ headers...")
    print(f"Genesis Hash: {GENESIS_HASH}")
    
    # Generate genesis.h
    with open("core/genesis.h", "w") as f:
        f.write(generate_genesis_h())
    print("✅ Generated core/genesis.h")
    
    # Generate genesis.cpp
    with open("core/genesis.cpp", "w") as f:
        f.write(generate_genesis_cpp())
    print("✅ Generated core/genesis.cpp")
    
    # Generate consensus.h
    with open("consensus/consensus.h", "w") as f:
        f.write(generate_consensus_h())
    print("✅ Generated consensus/consensus.h")
    
    print("\n🎉 All headers generated successfully!")

if __name__ == "__main__":
    main()
