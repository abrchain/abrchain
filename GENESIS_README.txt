
## 📄 GENESIS_README.txt

```markdown
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║     █████╗ ██████╗ ██████╗     ██████╗ ███████╗███████╗███████╗  ║
║    ██╔══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔════╝██╔════╝██╔════╝  ║
║    ███████║██████╔╝██████╔╝    ██████╔╝█████╗  █████╗  █████╗    ║
║    ██╔══██║██╔══██╗██╔══██╗    ██╔══██╗██╔══╝  ██╔══╝  ██╔══╝    ║
║    ██║  ██║██████╔╝██║  ██║    ██║  ██║███████╗███████╗███████╗  ║
║    ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝  ║
║                                                                   ║
║              AFRICA BITCOIN RESERVE - GENESIS BLOCK              ║
║                         IMMUTABLE FOREVER                         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝


GENESIS BLOCK INFORMATION
════════════════════════════════════════════════════════════════════

Genesis Hash:      3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7
Genesis TXID:      1780952e177d6b42e92ae4df7be0a60ee3cc33a13f3ef437ddea61b4ab86c7bf
Genesis Address:   1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ
Genesis Timestamp: 1771545600 (2026-02-19 12:00:00 UTC)
Genesis Message:   "Africa Bitcoin Reserve - Genesis Block - February 19, 2026 - United Africa"

PROTOCOL PARAMETERS
════════════════════════════════════════════════════════════════════

Total Supply:      1,000,000,000 ABR (FIXED)
Pre-mined:         517,851,000 ABR (51.7851%)
Mining Reserve:    482,149,000 ABR (48.2149%)
Nation Supply:     146,000,000 ABR (14.6% of total)
Block Time:        120 seconds (2 minutes)
Block Reward:      50 ABR (halves every 840,000 blocks)
Difficulty Adj:    2016 blocks (~4 weeks)
Max Block Size:    4 MB
Address Format:    Bech32 (abr1...)

UTXO DATABASE
════════════════════════════════════════════════════════════════════

Total UTXOs:       155
Total Value:       517,851,000 ABR
Genesis UTXO:      1 (Foundation)
Genesis Hash:      3da51579...aff3a7

NATION ALLOCATION
════════════════════════════════════════════════════════════════════

Total Nations:     55
Total Allocation:  146,000,000 ABR

Top 10 Nations:
────────────────────────────────────────────────────────────────────
Nigeria            20,000,000 ABR
South Africa       15,000,000 ABR
Kenya              10,000,000 ABR
Egypt              10,000,000 ABR
Ethiopia           8,000,000 ABR
Ghana              8,000,000 ABR
Tanzania           6,000,000 ABR
Uganda             6,000,000 ABR
Morocco            5,000,000 ABR
Angola             5,000,000 ABR
────────────────────────────────────────────────────────────────────

RESERVE ADDRESSES
════════════════════════════════════════════════════════════════════

Genesis Address:   1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ
Foundation:        1FOUNDATIONxxxxxxxxxxxxxxxxxxxxxxxxx
Central Banks:     1CENTRALBANKxxxxxxxxxxxxxxxxxxxxxxx

VERIFICATION COMMANDS
════════════════════════════════════════════════════════════════════

$ python verify_genesis.py
$ abr-cli getgenesisblock
$ abr-cli gettxoutsetinfo
$ abr-cli getnationsupply

SEED NODES
════════════════════════════════════════════════════════════════════

Primary:   seed.nairax.ng:8333
Backup:    seed.central.nairax.ng:8333
Explorer:  https://abr.nairax.ng/explorer

IMMUTABILITY GUARANTEE
════════════════════════════════════════════════════════════════════

This genesis block is FOREVER LOCKED. No human, no government, no entity
can change these parameters. The protocol hash is embedded in the ABR Core
binary and verified at every block. If it ever changes, the chain halts.

"Code is law. Forever."

═══ 3da51579...aff3a7 ═══
