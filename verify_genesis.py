#!/usr/bin/env python3
import json

# Load the allocation data
allocations = [
    # Foundation
    {"address": "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ", "amount": 10000000, "name": "Genesis Foundation"},
    # Central banks (summary)
    {"address": "1HseN7PvuhYMpUr2kmY1YxSAk9adDKGFn5", "amount": 2500000, "name": "Nigeria"},
    {"address": "19gaibE2WJkaqw3aeDoetp8cNv3k2D1hsH", "amount": 2000000, "name": "South Africa"},
    {"address": "121Uzd7JxwgVDHgfA6BbBHavchcFm5Fo5s", "amount": 1800000, "name": "Egypt"},
    {"address": "1GiKgvhYCQemji4yLNdLyzmnGmyNCkh3Dg", "amount": 1500000, "name": "Kenya"},
    {"address": "12Ukan6e6RKAjCDwv33srg64ztTWqwyRyU", "amount": 1400000, "name": "Ethiopia"},
    {"address": "1EShQyUqfAyA8uCdpBieH4v54quCgiVzG6", "amount": 1200000, "name": "Ghana"},
    {"address": "12ECVDibjWLeJeDDgJXyGk15PLnGpD4EEH", "amount": 1200000, "name": "Morocco"},
    {"address": "1AndGJZv82xRcFctsFHGrfCgpgyvbnTAxn", "amount": 1000000, "name": "Angola"},
    {"address": "19ubKCYdG2hW78U1X7ZQhZ4JNDXeBthuh9", "amount": 1000000, "name": "Tanzania"},
    {"address": "1HDikXM93Zt5WNrG5Ye3Dj6eoSDMStUyo1", "amount": 1000000, "name": "DR Congo"},
    {"address": "1G4uki5aK6BwttTwsTc3H9wGhbdHDaoEir", "amount": 900000, "name": "Algeria"},
    {"address": "13fVb1ydDYYTkyvym2MzcQdneoRHeYCDLW", "amount": 800000, "name": "Uganda"},
    {"address": "1MUnWGjaxezY32ZzH5p2Lh9XPB6vJSEYu6", "amount": 700000, "name": "Sudan"},
    {"address": "1F7nbBoFLfiMvw1wbSuoKjJVb2nwsiFKVi", "amount": 700000, "name": "Côte d'Ivoire"},
    {"address": "16XLTo821TrW1Vv6BmnaDQk9aN3U1sKzBK", "amount": 600000, "name": "Cameroon"},
    {"address": "1Bvod6bwdgSsjvWvF9kQwbTUBrqhK9rx8N", "amount": 500000, "name": "Zimbabwe"},
    {"address": "1KV88YAxT14hpWyhF5foybZrUrJUbwMpQU", "amount": 500000, "name": "Zambia"},
    {"address": "1KqKB4dfFRZP43bQ8QeeMkzvZJA7ThAzim", "amount": 500000, "name": "Senegal"},
    {"address": "1FspsNiJtVMMp3kULLakqRYHB7oWvdky5g", "amount": 400000, "name": "Mali"},
    {"address": "1A6naVVrCtLvaTMpTUdaAfjnKDgb5VomZz", "amount": 400000, "name": "Burkina Faso"},
    {"address": "1ESxMXwK7kqqtfzvcxQ8PbKnekNrFuEYon", "amount": 300000, "name": "Malawi"},
    {"address": "17C6XXZ6kJQM5aV2cqizNdgNwPqevX8eyj", "amount": 300000, "name": "Benin"},
    {"address": "1KfS7MW928tNST7aekeCW9gF7uCr8Vk4QQ", "amount": 300000, "name": "Guinea"},
    {"address": "1CAqEYumqR1STxRU3rxpLpQ1Uz9J2mj9my", "amount": 300000, "name": "Rwanda"},
    {"address": "15FC8gDc136jRgxk7t33aeWefStemg47Zs", "amount": 250000, "name": "Burundi"},
    {"address": "1PHn4dgmpG1DL6p3Xg4NMJn6YcuhCCmfDy", "amount": 250000, "name": "Togo"},
    {"address": "1AZbWhCBKwdtd88h1ScFSLE8kYLeXUAnjZ", "amount": 250000, "name": "Sierra Leone"},
    {"address": "1J693GMxsQ2XKG9JKewj6UgWw2ZKVX4unp", "amount": 250000, "name": "Liberia"},
    {"address": "1H2deEf7uccpKWucDy5eHMKTRREJpjyssy", "amount": 200000, "name": "Central African Republic"},
    {"address": "1Dk5t6q4PP7HDwuHwyJeQgkRq9XaKPAgks", "amount": 200000, "name": "Republic of Congo"},
    {"address": "1K5kwmZn3cSjW1TU9dNfnfEHEevkipiLB1", "amount": 200000, "name": "Gabon"},
    {"address": "13iFboh7QCwYC6cuW1v3sHNcHYLfAGU4JA", "amount": 200000, "name": "Equatorial Guinea"},
    {"address": "13awVAEACHHKW2Wknw5dtMDjmYxpoDjTLL", "amount": 200000, "name": "Botswana"},
    {"address": "1LNjXGpkoV2Z58fiis12nu1qkKT3kUev7D", "amount": 200000, "name": "Namibia"},
    {"address": "15jYkFip1hcT9PvUh2Wrv6QswvhXD7TCbN", "amount": 150000, "name": "Lesotho"},
    {"address": "1LrG6RioRoevKHLGhpEtit98XGzoKQrQ41", "amount": 150000, "name": "Eswatini"},
    {"address": "18mq7mf31SwKRyLn3gwmZn1SrUmussZGd", "amount": 150000, "name": "Comoros"},
    {"address": "1KKow4wCfu9LMR8irMhtinqjQVtdHYs8nv", "amount": 150000, "name": "Cabo Verde"},
    {"address": "1HGqoZ78LKWP7TorTAp7cojWDtSSkNoUUu", "amount": 150000, "name": "São Tomé and Príncipe"},
    {"address": "1JZQuVgg7as4JzQuhEnxjQgD6WSz3dwsgU", "amount": 150000, "name": "Mauritius"},
    {"address": "1BZNiNPuFqdApFhzVGNqJhpNfBebgEThiH", "amount": 150000, "name": "Seychelles"},
    {"address": "1DHaC6PrScK2yBzm8QwTQNraEdb5Bkiso7", "amount": 150000, "name": "Djibouti"},
    {"address": "19pBhkCBbsZ8fQdhCJqVvNcvofdeU8yhXd", "amount": 150000, "name": "Eritrea"},
    {"address": "1FQL7MEUMuiZUMnE1sJ58jXSa2VBUhWHxL", "amount": 150000, "name": "South Sudan"},
    {"address": "1512zbtZWBayxhyf1uH7PQCnxNEy2yFdpG", "amount": 150000, "name": "Mauritania"},
    {"address": "1JtBtK2Bd1VUYRJydiyndJrUTGUveej9U1", "amount": 150000, "name": "Gambia"},
    {"address": "13bLfHugxHXjJTYLQmMt715bQnmfsAzoJV", "amount": 150000, "name": "Guinea-Bissau"},
    {"address": "13XEU9HMu4ZHdUZ11vk8rMGgsBUDb6Pwd4", "amount": 150000, "name": "Niger"},
    {"address": "1GVqjsxsV6bDzQSHP3tbiYt8icfWnGm5SX", "amount": 150000, "name": "Chad"},
    {"address": "1LKCKyUGCV1uWRMfVv1WmThh4cEqE8vqRX", "amount": 150000, "name": "Somalia"},
    {"address": "1MbDi8jzEGTzaev71ZERahU8BJje4594n5", "amount": 150000, "name": "Libya"},
    {"address": "12NHFFG9T3RfNfP8asvcShMA4dEsEywWLJ", "amount": 150000, "name": "Tunisia"},
    {"address": "1B3Dgcbc88AfdXqzskYbQh9JQNQHHFNLQR", "amount": 100000, "name": "Western Sahara"},
    # Whales (just a few for verification)
    {"address": "1E7ZNdUHo2PF2xGZiRfZUcxuiSaKJ5xo8k", "amount": 800000, "name": "Pan-African Investment Fund"},
    {"address": "1HnwZvAewfgDWdweqAJyCersJH5NJDbgoz", "amount": 800000, "name": "Middle East Strategic Partners"},
    {"address": "1A1cTbie4LAAmUSCKnhpCUQs1qgmVyEnKm", "amount": 800000, "name": "Asian Infrastructure Fund"},
    {"address": "16kiGbq8GTYHSZg9fqrCXD6ZmRyR2FYp8v", "amount": 800000, "name": "European Development Finance"},
    {"address": "1PoMnSwuhzznLTqTkh7P5AiCiu56M1LJMZ", "amount": 800000, "name": "North American Pension Fund"},
]

total = sum(a['amount'] for a in allocations)
print(f"Total genesis supply: {total:,} ABR")
print(f"Expected: 517,851,000 ABR")
print(f"Match: {total == 517851000}")

# Count by type
foundation = sum(a['amount'] for a in allocations if "Foundation" in a['name'])
central_banks = sum(a['amount'] for a in allocations if a['amount'] <= 2500000 and a['amount'] >= 100000 and "Fund" not in a['name'] and "Foundation" not in a['name'])
whales = sum(a['amount'] for a in allocations if "Fund" in a['name'] or "Partners" in a['name'] or "Pension" in a['name'])

print(f"\nBreakdown:")
print(f"  Foundation: {foundation:,} ABR")
print(f"  Central Banks: {central_banks:,} ABR")
print(f"  Whales: {whales:,} ABR")
print(f"  Total: {foundation + central_banks + whales:,} ABR")
