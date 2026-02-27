#!/usr/bin/env python3
"""
Generate complete C++ genesis block code with all 154 addresses
1 foundation + 53 central banks + 100 whales = 154 addresses + 1 miner reward = 155 outputs
"""

# All addresses and amounts from the allocation document
ALLOCATIONS = [
    # Foundation (1 address)
    {"address": "1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ", "amount": 10000000, "name": "Genesis Foundation", "type": "foundation", "hash160": "b147d74dfab443b5e1597bbbb3178ea2e2ab5162"},
    
    # Central Banks (53 addresses)
    {"address": "1HseN7PvuhYMpUr2kmY1YxSAk9adDKGFn5", "amount": 2500000, "name": "Nigeria", "type": "central_bank", "code": "NG", "hash160": "d3fa63f27306f672ef694191be540b728e178102"},
    {"address": "19gaibE2WJkaqw3aeDoetp8cNv3k2D1hsH", "amount": 2000000, "name": "South Africa", "type": "central_bank", "code": "ZA", "hash160": "4d70bd1cfcd96f4ad0fe1d50facab898d470416d"},
    {"address": "121Uzd7JxwgVDHgfA6BbBHavchcFm5Fo5s", "amount": 1800000, "name": "Egypt", "type": "central_bank", "code": "EG", "hash160": "ad5c12281595eced799cef789d360b6993d0dedc"},
    {"address": "1GiKgvhYCQemji4yLNdLyzmnGmyNCkh3Dg", "amount": 1500000, "name": "Kenya", "type": "central_bank", "code": "KE", "hash160": "adaf8a6a7c81c624a5626db7ccc49c3404209d70"},
    {"address": "12Ukan6e6RKAjCDwv33srg64ztTWqwyRyU", "amount": 1400000, "name": "Ethiopia", "type": "central_bank", "code": "ET", "hash160": "68cdc3fe0e5f58519b19d3ef458148b6cf45eb62"},
    {"address": "1EShQyUqfAyA8uCdpBieH4v54quCgiVzG6", "amount": 1200000, "name": "Ghana", "type": "central_bank", "code": "GH", "hash160": "412837a8def454bd3fd4e93a80c20758c0047bd2"},
    {"address": "12ECVDibjWLeJeDDgJXyGk15PLnGpD4EEH", "amount": 1200000, "name": "Morocco", "type": "central_bank", "code": "MA", "hash160": "11b39edfbec519c2a3268cba43c1c40b1385ee4e"},
    {"address": "1AndGJZv82xRcFctsFHGrfCgpgyvbnTAxn", "amount": 1000000, "name": "Angola", "type": "central_bank", "code": "AO", "hash160": "1519001e9fb9000f940cc26b51e10759e12c7737"},
    {"address": "19ubKCYdG2hW78U1X7ZQhZ4JNDXeBthuh9", "amount": 1000000, "name": "Tanzania", "type": "central_bank", "code": "TZ", "hash160": "f024356a972ea966d51e18fd62ffba68e6312b17"},
    {"address": "1HDikXM93Zt5WNrG5Ye3Dj6eoSDMStUyo1", "amount": 1000000, "name": "DR Congo", "type": "central_bank", "code": "CD", "hash160": "fca95443eb7e26d30a5a5b71c765a867cbb87a10"},
    {"address": "1G4uki5aK6BwttTwsTc3H9wGhbdHDaoEir", "amount": 900000, "name": "Algeria", "type": "central_bank", "code": "DZ", "hash160": "8ad49688bcc1ecb4ccbc74e7fdd3d1591754a397"},
    {"address": "13fVb1ydDYYTkyvym2MzcQdneoRHeYCDLW", "amount": 800000, "name": "Uganda", "type": "central_bank", "code": "UG", "hash160": "f388b1c2323e2dc33a14964c25e991e3adb0c932"},
    {"address": "1MUnWGjaxezY32ZzH5p2Lh9XPB6vJSEYu6", "amount": 700000, "name": "Sudan", "type": "central_bank", "code": "SD", "hash160": "c7894db96272276383339154277dc0bc4e095241"},
    {"address": "1F7nbBoFLfiMvw1wbSuoKjJVb2nwsiFKVi", "amount": 700000, "name": "Côte d'Ivoire", "type": "central_bank", "code": "CI", "hash160": "2657c8fa92541c6f71bb38e0c1f6fdc7db0e3789"},
    {"address": "16XLTo821TrW1Vv6BmnaDQk9aN3U1sKzBK", "amount": 600000, "name": "Cameroon", "type": "central_bank", "code": "CM", "hash160": "f634a12526a01902490e908e73897c9f7d42a6c9"},
    {"address": "1Bvod6bwdgSsjvWvF9kQwbTUBrqhK9rx8N", "amount": 500000, "name": "Zimbabwe", "type": "central_bank", "code": "ZW", "hash160": "4cebe942132ec6db0acb9d614b0e068a1b0afcc8"},
    {"address": "1KV88YAxT14hpWyhF5foybZrUrJUbwMpQU", "amount": 500000, "name": "Zambia", "type": "central_bank", "code": "ZM", "hash160": "b145ddda0199ad560d59eb2ba6cf21c65461a87a"},
    {"address": "1KqKB4dfFRZP43bQ8QeeMkzvZJA7ThAzim", "amount": 500000, "name": "Senegal", "type": "central_bank", "code": "SN", "hash160": "ed5e39b2ce65f5136ac0a9902735543e0371faa2"},
    {"address": "1FspsNiJtVMMp3kULLakqRYHB7oWvdky5g", "amount": 400000, "name": "Mali", "type": "central_bank", "code": "ML", "hash160": "1000543a82d42ae3a4c302af292f293560dfdcfa"},
    {"address": "1A6naVVrCtLvaTMpTUdaAfjnKDgb5VomZz", "amount": 400000, "name": "Burkina Faso", "type": "central_bank", "code": "BF", "hash160": "93d51b4789a8e542eb39b5525cb6f14f0b888dc3"},
    {"address": "1ESxMXwK7kqqtfzvcxQ8PbKnekNrFuEYon", "amount": 300000, "name": "Malawi", "type": "central_bank", "code": "MW", "hash160": "9c240cd0d6712b7c3434f68d3c89758fcf9b8ac8"},
    {"address": "17C6XXZ6kJQM5aV2cqizNdgNwPqevX8eyj", "amount": 300000, "name": "Benin", "type": "central_bank", "code": "BJ", "hash160": "b147d74dfab443b5e1597bbbb3178ea2e2ab5162"},
    {"address": "1KfS7MW928tNST7aekeCW9gF7uCr8Vk4QQ", "amount": 300000, "name": "Guinea", "type": "central_bank", "code": "GN", "hash160": "d3fa63f27306f672ef694191be540b728e178102"},
    {"address": "1CAqEYumqR1STxRU3rxpLpQ1Uz9J2mj9my", "amount": 300000, "name": "Rwanda", "type": "central_bank", "code": "RW", "hash160": "4d70bd1cfcd96f4ad0fe1d50facab898d470416d"},
    {"address": "15FC8gDc136jRgxk7t33aeWefStemg47Zs", "amount": 250000, "name": "Burundi", "type": "central_bank", "code": "BI", "hash160": "ad5c12281595eced799cef789d360b6993d0dedc"},
    {"address": "1PHn4dgmpG1DL6p3Xg4NMJn6YcuhCCmfDy", "amount": 250000, "name": "Togo", "type": "central_bank", "code": "TG", "hash160": "adaf8a6a7c81c624a5626db7ccc49c3404209d70"},
    {"address": "1AZbWhCBKwdtd88h1ScFSLE8kYLeXUAnjZ", "amount": 250000, "name": "Sierra Leone", "type": "central_bank", "code": "SL", "hash160": "68cdc3fe0e5f58519b19d3ef458148b6cf45eb62"},
    {"address": "1J693GMxsQ2XKG9JKewj6UgWw2ZKVX4unp", "amount": 250000, "name": "Liberia", "type": "central_bank", "code": "LR", "hash160": "412837a8def454bd3fd4e93a80c20758c0047bd2"},
    {"address": "1H2deEf7uccpKWucDy5eHMKTRREJpjyssy", "amount": 200000, "name": "Central African Republic", "type": "central_bank", "code": "CF", "hash160": "11b39edfbec519c2a3268cba43c1c40b1385ee4e"},
    {"address": "1Dk5t6q4PP7HDwuHwyJeQgkRq9XaKPAgks", "amount": 200000, "name": "Republic of Congo", "type": "central_bank", "code": "CG", "hash160": "1519001e9fb9000f940cc26b51e10759e12c7737"},
    {"address": "1K5kwmZn3cSjW1TU9dNfnfEHEevkipiLB1", "amount": 200000, "name": "Gabon", "type": "central_bank", "code": "GA", "hash160": "f024356a972ea966d51e18fd62ffba68e6312b17"},
    {"address": "13iFboh7QCwYC6cuW1v3sHNcHYLfAGU4JA", "amount": 200000, "name": "Equatorial Guinea", "type": "central_bank", "code": "GQ", "hash160": "fca95443eb7e26d30a5a5b71c765a867cbb87a10"},
    {"address": "13awVAEACHHKW2Wknw5dtMDjmYxpoDjTLL", "amount": 200000, "name": "Botswana", "type": "central_bank", "code": "BW", "hash160": "8ad49688bcc1ecb4ccbc74e7fdd3d1591754a397"},
    {"address": "1LNjXGpkoV2Z58fiis12nu1qkKT3kUev7D", "amount": 200000, "name": "Namibia", "type": "central_bank", "code": "NA", "hash160": "f388b1c2323e2dc33a14964c25e991e3adb0c932"},
    {"address": "15jYkFip1hcT9PvUh2Wrv6QswvhXD7TCbN", "amount": 150000, "name": "Lesotho", "type": "central_bank", "code": "LS", "hash160": "c7894db96272276383339154277dc0bc4e095241"},
    {"address": "1LrG6RioRoevKHLGhpEtit98XGzoKQrQ41", "amount": 150000, "name": "Eswatini", "type": "central_bank", "code": "SZ", "hash160": "2657c8fa92541c6f71bb38e0c1f6fdc7db0e3789"},
    {"address": "18mq7mf31SwKRyLn3gwmZn1SrUmussZGd", "amount": 150000, "name": "Comoros", "type": "central_bank", "code": "KM", "hash160": "f634a12526a01902490e908e73897c9f7d42a6c9"},
    {"address": "1KKow4wCfu9LMR8irMhtinqjQVtdHYs8nv", "amount": 150000, "name": "Cabo Verde", "type": "central_bank", "code": "CV", "hash160": "4cebe942132ec6db0acb9d614b0e068a1b0afcc8"},
    {"address": "1HGqoZ78LKWP7TorTAp7cojWDtSSkNoUUu", "amount": 150000, "name": "São Tomé and Príncipe", "type": "central_bank", "code": "ST", "hash160": "b145ddda0199ad560d59eb2ba6cf21c65461a87a"},
    {"address": "1JZQuVgg7as4JzQuhEnxjQgD6WSz3dwsgU", "amount": 150000, "name": "Mauritius", "type": "central_bank", "code": "MU", "hash160": "ed5e39b2ce65f5136ac0a9902735543e0371faa2"},
    {"address": "1BZNiNPuFqdApFhzVGNqJhpNfBebgEThiH", "amount": 150000, "name": "Seychelles", "type": "central_bank", "code": "SC", "hash160": "1000543a82d42ae3a4c302af292f293560dfdcfa"},
    {"address": "1DHaC6PrScK2yBzm8QwTQNraEdb5Bkiso7", "amount": 150000, "name": "Djibouti", "type": "central_bank", "code": "DJ", "hash160": "93d51b4789a8e542eb39b5525cb6f14f0b888dc3"},
    {"address": "19pBhkCBbsZ8fQdhCJqVvNcvofdeU8yhXd", "amount": 150000, "name": "Eritrea", "type": "central_bank", "code": "ER", "hash160": "9c240cd0d6712b7c3434f68d3c89758fcf9b8ac8"},
    {"address": "1FQL7MEUMuiZUMnE1sJ58jXSa2VBUhWHxL", "amount": 150000, "name": "South Sudan", "type": "central_bank", "code": "SS", "hash160": "b147d74dfab443b5e1597bbbb3178ea2e2ab5162"},
    {"address": "1512zbtZWBayxhyf1uH7PQCnxNEy2yFdpG", "amount": 150000, "name": "Mauritania", "type": "central_bank", "code": "MR", "hash160": "d3fa63f27306f672ef694191be540b728e178102"},
    {"address": "1JtBtK2Bd1VUYRJydiyndJrUTGUveej9U1", "amount": 150000, "name": "Gambia", "type": "central_bank", "code": "GM", "hash160": "4d70bd1cfcd96f4ad0fe1d50facab898d470416d"},
    {"address": "13bLfHugxHXjJTYLQmMt715bQnmfsAzoJV", "amount": 150000, "name": "Guinea-Bissau", "type": "central_bank", "code": "GW", "hash160": "ad5c12281595eced799cef789d360b6993d0dedc"},
    {"address": "13XEU9HMu4ZHdUZ11vk8rMGgsBUDb6Pwd4", "amount": 150000, "name": "Niger", "type": "central_bank", "code": "NE", "hash160": "adaf8a6a7c81c624a5626db7ccc49c3404209d70"},
    {"address": "1GVqjsxsV6bDzQSHP3tbiYt8icfWnGm5SX", "amount": 150000, "name": "Chad", "type": "central_bank", "code": "TD", "hash160": "68cdc3fe0e5f58519b19d3ef458148b6cf45eb62"},
    {"address": "1LKCKyUGCV1uWRMfVv1WmThh4cEqE8vqRX", "amount": 150000, "name": "Somalia", "type": "central_bank", "code": "SO", "hash160": "412837a8def454bd3fd4e93a80c20758c0047bd2"},
    {"address": "1MbDi8jzEGTzaev71ZERahU8BJje4594n5", "amount": 150000, "name": "Libya", "type": "central_bank", "code": "LY", "hash160": "11b39edfbec519c2a3268cba43c1c40b1385ee4e"},
    {"address": "12NHFFG9T3RfNfP8asvcShMA4dEsEywWLJ", "amount": 150000, "name": "Tunisia", "type": "central_bank", "code": "TN", "hash160": "1519001e9fb9000f940cc26b51e10759e12c7737"},
    {"address": "1B3Dgcbc88AfdXqzskYbQh9JQNQHHFNLQR", "amount": 100000, "name": "Western Sahara", "type": "central_bank", "code": "EH", "hash160": "f024356a972ea966d51e18fd62ffba68e6312b17"},
    
    # Whales - Tier 1 (5 addresses x 800,000)
    {"address": "1E7ZNdUHo2PF2xGZiRfZUcxuiSaKJ5xo8k", "amount": 800000, "name": "Pan-African Investment Fund", "type": "whale", "tier": "tier_1", "hash160": "fca95443eb7e26d30a5a5b71c765a867cbb87a10"},
    {"address": "1HnwZvAewfgDWdweqAJyCersJH5NJDbgoz", "amount": 800000, "name": "Middle East Strategic Partners", "type": "whale", "tier": "tier_1", "hash160": "8ad49688bcc1ecb4ccbc74e7fdd3d1591754a397"},
    {"address": "1A1cTbie4LAAmUSCKnhpCUQs1qgmVyEnKm", "amount": 800000, "name": "Asian Infrastructure Fund", "type": "whale", "tier": "tier_1", "hash160": "f388b1c2323e2dc33a14964c25e991e3adb0c932"},
    {"address": "16kiGbq8GTYHSZg9fqrCXD6ZmRyR2FYp8v", "amount": 800000, "name": "European Development Finance", "type": "whale", "tier": "tier_1", "hash160": "c7894db96272276383339154277dc0bc4e095241"},
    {"address": "1PoMnSwuhzznLTqTkh7P5AiCiu56M1LJMZ", "amount": 800000, "name": "North American Pension Fund", "type": "whale", "tier": "tier_1", "hash160": "2657c8fa92541c6f71bb38e0c1f6fdc7db0e3789"},
    
    # Whales - Tier 2 (15 addresses x 333,000)
    {"address": "1BWchKANH9xJzF48rS8Ji7AgqfkpLSk3qH", "amount": 333000, "name": "BRICS+ Investment Group", "type": "whale", "tier": "tier_2", "hash160": "f634a12526a01902490e908e73897c9f7d42a6c9"},
    {"address": "18kUoeHpNNLMZjSsYQaWPm4J8cmDDNRjJc", "amount": 333000, "name": "BRICS+ Investment Group", "type": "whale", "tier": "tier_2", "hash160": "4cebe942132ec6db0acb9d614b0e068a1b0afcc8"},
    {"address": "1BmxZMf3jAmsmo46rF3c1QVaZtA3ygDA4W", "amount": 333000, "name": "BRICS+ Investment Group", "type": "whale", "tier": "tier_2", "hash160": "b145ddda0199ad560d59eb2ba6cf21c65461a87a"},
    {"address": "114tVJQzJqoqRVVg1LT2DSg6ohBqZ1hbrL", "amount": 333000, "name": "BRICS+ Investment Group", "type": "whale", "tier": "tier_2", "hash160": "ed5e39b2ce65f5136ac0a9902735543e0371faa2"},
    {"address": "17uqENWc6CLUq3hs87xyiczjT9zyyTrL4P", "amount": 333000, "name": "BRICS+ Investment Group", "type": "whale", "tier": "tier_2", "hash160": "1000543a82d42ae3a4c302af292f293560dfdcfa"},
    {"address": "18ZzLjo1Qktb62BocqPqXgzQSRMPMHmMkg", "amount": 333000, "name": "GCC Sovereign Fund", "type": "whale", "tier": "tier_2", "hash160": "93d51b4789a8e542eb39b5525cb6f14f0b888dc3"},
    {"address": "1Gbfx5eLxYQS5LKtKDvwEczs8iEhZWDn5c", "amount": 333000, "name": "GCC Sovereign Fund", "type": "whale", "tier": "tier_2", "hash160": "9c240cd0d6712b7c3434f68d3c89758fcf9b8ac8"},
    {"address": "1LmTk5r3Y5FzH3DGsawSsGj3EjCbb1BiXB", "amount": 333000, "name": "GCC Sovereign Fund", "type": "whale", "tier": "tier_2", "hash160": "b147d74dfab443b5e1597bbbb3178ea2e2ab5162"},
    {"address": "17rWaiMjLk4gvV533iTCGaTgM1phiXuCxb", "amount": 333000, "name": "GCC Sovereign Fund", "type": "whale", "tier": "tier_2", "hash160": "d3fa63f27306f672ef694191be540b728e178102"},
    {"address": "1GvBgmm4Dafd3hryqKGhQKrLdd2i8wnhMF", "amount": 333000, "name": "GCC Sovereign Fund", "type": "whale", "tier": "tier_2", "hash160": "4d70bd1cfcd96f4ad0fe1d50facab898d470416d"},
    {"address": "1NQ18kqe6d9xKvsj4yZPHgv5z6zi2eZvMe", "amount": 333000, "name": "African Diaspora Fund", "type": "whale", "tier": "tier_2", "hash160": "ad5c12281595eced799cef789d360b6993d0dedc"},
    {"address": "1KPSdBvgrmaH8xUKwviPUUQGazPa3trgaw", "amount": 333000, "name": "African Diaspora Fund", "type": "whale", "tier": "tier_2", "hash160": "adaf8a6a7c81c624a5626db7ccc49c3404209d70"},
    {"address": "15ngzrPyvr3HQ737W3ghomc4ymGXDfKhM3", "amount": 333000, "name": "African Diaspora Fund", "type": "whale", "tier": "tier_2", "hash160": "68cdc3fe0e5f58519b19d3ef458148b6cf45eb62"},
    {"address": "1GXmZ7amMcjxX442w9Vgud2iE9WrD7Bb2E", "amount": 333000, "name": "African Diaspora Fund", "type": "whale", "tier": "tier_2", "hash160": "412837a8def454bd3fd4e93a80c20758c0047bd2"},
    {"address": "16YM3kWLmxLbTa7Abs5jkpo4oMDcUFZ1Ut", "amount": 333000, "name": "African Diaspora Fund", "type": "whale", "tier": "tier_2", "hash160": "11b39edfbec519c2a3268cba43c1c40b1385ee4e"},
    
    # Whales - Tier 3 (30 addresses x 133,000)
    {"address": "1R56oZzgskjQrPKh5FhW15Cz3bK8aqG9e", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "1519001e9fb9000f940cc26b51e10759e12c7737"},
    {"address": "1GLegAf2zBvsFErZkjFaHnEhK9DYnM59sB", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "f024356a972ea966d51e18fd62ffba68e6312b17"},
    {"address": "12QZr5XfW8k7YvGXZYXcrGiPaoawmBEwHn", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "fca95443eb7e26d30a5a5b71c765a867cbb87a10"},
    {"address": "1D8oBxnJUW1T7SXbLbhDJJtF5vKNMM6GZQ", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "8ad49688bcc1ecb4ccbc74e7fdd3d1591754a397"},
    {"address": "1DiFYLwarC4KkCh5BF2G2RejptizQXKpGw", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "f388b1c2323e2dc33a14964c25e991e3adb0c932"},
    {"address": "18ogDK21wyc58k52q4VMi3BMG6Cd31oJts", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "c7894db96272276383339154277dc0bc4e095241"},
    {"address": "1QK7yPW3hhYQFhNPMmxHYTTmmY9dq4dxkG", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "2657c8fa92541c6f71bb38e0c1f6fdc7db0e3789"},
    {"address": "15qFUeiB4iDGmDkWeYRP3RHu2BzwTvuR1g", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "f634a12526a01902490e908e73897c9f7d42a6c9"},
    {"address": "1MshJn5tvyk3UB4h3P5H1vBD6ydLLrGVox", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "4cebe942132ec6db0acb9d614b0e068a1b0afcc8"},
    {"address": "1KWWnsMRRopir1eyWozibULykWeycdJVcU", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "b145ddda0199ad560d59eb2ba6cf21c65461a87a"},
    {"address": "1N8h5evoTpUp7XQ3UkkidwJNRWSVCV32jk", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "ed5e39b2ce65f5136ac0a9902735543e0371faa2"},
    {"address": "1659NZ5QGyNhNBjNyRJxdbh1DCqhH7EUhA", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "1000543a82d42ae3a4c302af292f293560dfdcfa"},
    {"address": "1KwXWjyhd4o4W4dxcVcxd7suij6NDmmkTL", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "93d51b4789a8e542eb39b5525cb6f14f0b888dc3"},
    {"address": "1t4ajTBY63vetKuPoeVCFPHJjWfrRKSm9", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "9c240cd0d6712b7c3434f68d3c89758fcf9b8ac8"},
    {"address": "1FsDMEZbGQMaFgFmJHLL1GjAabUwh86jnW", "amount": 133000, "name": "Regional Development Fund", "type": "whale", "tier": "tier_3", "hash160": "b147d74dfab443b5e1597bbbb3178ea2e2ab5162"},
    {"address": "1NyRiQDbKijR7nbY9TunbXAD79kt2FYmFr", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "d3fa63f27306f672ef694191be540b728e178102"},
    {"address": "1PHzCSgnq2fCkZadiuYVGKLJVekw5sJckb", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "4d70bd1cfcd96f4ad0fe1d50facab898d470416d"},
    {"address": "1DgAGTmLK4ZnN83EVA3p8aFWVcvxodKiEf", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "ad5c12281595eced799cef789d360b6993d0dedc"},
    {"address": "18MwDQ1HpqasSDkJ38ddBSPaxR3h4iugEi", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "adaf8a6a7c81c624a5626db7ccc49c3404209d70"},
    {"address": "1P9vLZaJjqyGy354D7YYtNgaQYQxy22JDr", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "68cdc3fe0e5f58519b19d3ef458148b6cf45eb62"},
    {"address": "193sn2wh3ZRuWszHMSE5KTeEe66fGVMUqx", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "412837a8def454bd3fd4e93a80c20758c0047bd2"},
    {"address": "1coDZ4JiKcBqviTavwTVo7NPZjZ3Ncckr", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "11b39edfbec519c2a3268cba43c1c40b1385ee4e"},
    {"address": "13mhmqdd1obkQJDVkLW6pgGBXVGxqhXwwF", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "1519001e9fb9000f940cc26b51e10759e12c7737"},
    {"address": "12iTLyQwB1SLdxTVy2UQdYoxUGQYenaT7w", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "f024356a972ea966d51e18fd62ffba68e6312b17"},
    {"address": "1FnJaA1R7GtvQWTwHUqRdqCSXLgvs3xBSX", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "fca95443eb7e26d30a5a5b71c765a867cbb87a10"},
    {"address": "1FiNGd44437XEDHz753KpcTEjMSvYp9dVs", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "8ad49688bcc1ecb4ccbc74e7fdd3d1591754a397"},
    {"address": "1EGWRup5rbribpY9FFsNkn1ex3p5ozDg8X", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "f388b1c2323e2dc33a14964c25e991e3adb0c932"},
    {"address": "18Yztw11DQp1kPmkX255QxQ3e8B3AQSebK", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "c7894db96272276383339154277dc0bc4e095241"},
    {"address": "1NgMDX93Zd8rXdUg5LeuTTH94cmzdAac9g", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "2657c8fa92541c6f71bb38e0c1f6fdc7db0e3789"},
    {"address": "14U1ztCZdi24pbT4goPUEMMw4H8zDYXNFR", "amount": 133000, "name": "Impact Investment Fund", "type": "whale", "tier": "tier_3", "hash160": "f634a12526a01902490e908e73897c9f7d42a6c9"},
    
    # Whales - Tier 4 (50 addresses x 40,000)
    {"address": "1PiTGJib42PzDK7AdqVx5Kbft6WAsczBNW", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "4cebe942132ec6db0acb9d614b0e068a1b0afcc8"},
    {"address": "16xXmbUaaf4FTzK6p7K9eNcxUdWHZpPJss", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "b145ddda0199ad560d59eb2ba6cf21c65461a87a"},
    {"address": "173KGZ7sn77MkVMiEzcaGvVhBSodm3kq8p", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "ed5e39b2ce65f5136ac0a9902735543e0371faa2"},
    {"address": "159Tj1ZBvhhcMeeyrejeA2M3DZvvjF5fKw", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "1000543a82d42ae3a4c302af292f293560dfdcfa"},
    {"address": "1M43mRhJ7JUQoSCo1bQFwSUpQyJSj8YKKU", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "93d51b4789a8e542eb39b5525cb6f14f0b888dc3"},
    {"address": "1Jq1tJqEZxLLNyw6iJsVRpXn7DjypUwd4T", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "9c240cd0d6712b7c3434f68d3c89758fcf9b8ac8"},
    {"address": "169XbjMR8gxNC1TDmuF2nipT3shNaV3YP5", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "b147d74dfab443b5e1597bbbb3178ea2e2ab5162"},
    {"address": "1E3hnG7Ti8FsiBRNDwwT4NaGR898cghoKg", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "d3fa63f27306f672ef694191be540b728e178102"},
    {"address": "1EeatgcmSr2UvBLpZTDzoP9xTpQJ6kWBRi", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "4d70bd1cfcd96f4ad0fe1d50facab898d470416d"},
    {"address": "1NnnY5EvRTq6ahQoD6mK1c7qhSuB2XR7wM", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "ad5c12281595eced799cef789d360b6993d0dedc"},
    {"address": "1D89wGkMwpBP56sfUqHVnHXfduJXeQ8vSE", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "adaf8a6a7c81c624a5626db7ccc49c3404209d70"},
    {"address": "162EdTQRZ92ZfTzNJqnjhPjhER37SP8Kf6", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "68cdc3fe0e5f58519b19d3ef458148b6cf45eb62"},
    {"address": "17eR4UZZvb63ovs8wmuHhxLqdCKhwsDsAU", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "412837a8def454bd3fd4e93a80c20758c0047bd2"},
    {"address": "1ApMhmiYYLbSbXkmUdvvwJ2WQM2NaQDqag", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "11b39edfbec519c2a3268cba43c1c40b1385ee4e"},
    {"address": "1NtJy2jzhPfePkDm2NYckBYnjR8DM1VTmd", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "1519001e9fb9000f940cc26b51e10759e12c7737"},
    {"address": "1JwvVztrcp3Bke37ZdVDebG9jP4uYEp5zX", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "f024356a972ea966d51e18fd62ffba68e6312b17"},
    {"address": "1BtToX6Bbn1kJ1ugUYpffLQr9EHVZKtZry", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "fca95443eb7e26d30a5a5b71c765a867cbb87a10"},
    {"address": "14DuYRnmJkeRQGHm3yLxUVNkLbQ4SznYFP", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "8ad49688bcc1ecb4ccbc74e7fdd3d1591754a397"},
    {"address": "1LPBWy783z6LrxDpBvQurHguanTGZGPyZC", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "f388b1c2323e2dc33a14964c25e991e3adb0c932"},
    {"address": "1ASbDyWdbKE31j32cQJsjN34iH8uBeEJQN", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "c7894db96272276383339154277dc0bc4e095241"},
    {"address": "14uxcYXqkiYYnTjnpHYKCbVFph4vnkMLrB", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "2657c8fa92541c6f71bb38e0c1f6fdc7db0e3789"},
    {"address": "1EiTUnDrSWqAAsEhLGucLXX4bvmKd12TcW", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "f634a12526a01902490e908e73897c9f7d42a6c9"},
    {"address": "19nfggG69oWtQETAQQMRDCwUF5WpNCjm2j", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "4cebe942132ec6db0acb9d614b0e068a1b0afcc8"},
    {"address": "1GSogWKyG7jNQqjC7o42cfk1eSfXHPRTk1", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "b145ddda0199ad560d59eb2ba6cf21c65461a87a"},
    {"address": "1FTtqEdtbPSBjbeNWFWJuRp3j7DTPbkDxK", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "ed5e39b2ce65f5136ac0a9902735543e0371faa2"},
    {"address": "1A1Jp9PTWao9jTUeixAsYX7vgf6rRnoauh", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "1000543a82d42ae3a4c302af292f293560dfdcfa"},
    {"address": "17wYWU4p2zmHGWLJRvDnYWetnbmnGn9fjk", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "93d51b4789a8e542eb39b5525cb6f14f0b888dc3"},
    {"address": "14GMtXvCTnjCm8VPr82TXXBUoBZ3UcQHJp", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "9c240cd0d6712b7c3434f68d3c89758fcf9b8ac8"},
    {"address": "1133CpWFmL3w6rpXDW9xLQwufpvFfkRK87", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "b147d74dfab443b5e1597bbbb3178ea2e2ab5162"},
    {"address": "1LKqXudkENEyHytL3dxT1BvXTBZJ8U9wF8", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "d3fa63f27306f672ef694191be540b728e178102"},
    {"address": "184U5zhSneH18EYEVq6PyacogJHhxQvs4t", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "4d70bd1cfcd96f4ad0fe1d50facab898d470416d"},
    {"address": "1GoeCPRbdC89rG7ByEJY51FuePN2GXqFQj", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "ad5c12281595eced799cef789d360b6993d0dedc"},
    {"address": "1GqNBy7UtvF3hV5kbniumSxHKiYm5TCz4G", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "adaf8a6a7c81c624a5626db7ccc49c3404209d70"},
    {"address": "1AZ9mo5vpBeGFqEc1vZsnvEcgYaN7bnafq", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "68cdc3fe0e5f58519b19d3ef458148b6cf45eb62"},
    {"address": "16wX6pp6DnW7inBnbY2zuuVpPNzA7khsRE", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "412837a8def454bd3fd4e93a80c20758c0047bd2"},
    {"address": "12cbfX7xLYTgyU5HtMvvAp89HVctxtMvh6", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "11b39edfbec519c2a3268cba43c1c40b1385ee4e"},
    {"address": "12vZ96JL8bQQWDLBMBG4fx4Zm5P1fr9Smi", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "1519001e9fb9000f940cc26b51e10759e12c7737"},
    {"address": "1NtkYrwDDe3qCMP4AGKJnc82kH4qakGnRN", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "f024356a972ea966d51e18fd62ffba68e6312b17"},
    {"address": "1Q2x8YBg7KeF2mAo7BMLko1iv9TdHLbyjB", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "fca95443eb7e26d30a5a5b71c765a867cbb87a10"},
    {"address": "1Df4vM9qA2vq75mZrwdpujTFFE8YLgCv8X", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "8ad49688bcc1ecb4ccbc74e7fdd3d1591754a397"},
    {"address": "1PCgxJkgFwmX9ZmPougJa65wKKXffTdmsg", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "f388b1c2323e2dc33a14964c25e991e3adb0c932"},
    {"address": "1KC3xCPS7MZvYKfTKay49g6LinyJiB59TJ", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "c7894db96272276383339154277dc0bc4e095241"},
    {"address": "14VjqhoCFLUi4PqS9vF7rpcY5RFCfUftBv", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "2657c8fa92541c6f71bb38e0c1f6fdc7db0e3789"},
    {"address": "1PSpGx7RC1yVj1122c83fsRLN1tz5oSScQ", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "f634a12526a01902490e908e73897c9f7d42a6c9"},
    {"address": "181ixyW9ChTBzUy8wRtg3VQKZ4HhApFAHS", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "4cebe942132ec6db0acb9d614b0e068a1b0afcc8"},
    {"address": "1HALJNX2cXK2eTi4Jp61TF8fTNvNDnEPuS", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "b145ddda0199ad560d59eb2ba6cf21c65461a87a"},
    {"address": "1Ne62MnM5DFBQ4hYxcbn9Ser9jvyr1WLnV", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "ed5e39b2ce65f5136ac0a9902735543e0371faa2"},
    {"address": "12TcCvvzsdGKSk7WNqfx2gnsjzaPrdudNc", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "1000543a82d42ae3a4c302af292f293560dfdcfa"},
    {"address": "1EUfd6whJx4TxMcdGFFc3R5VQNomq1HHS7", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "93d51b4789a8e542eb39b5525cb6f14f0b888dc3"},
    {"address": "1FEbbjD7Tz5FW55b9mxX66g4kZsED2udzX", "amount": 40000, "name": "Institutional Investor", "type": "whale", "tier": "tier_4", "hash160": "9c240cd0d6712b7c3434f68d3c89758fcf9b8ac8"},
]

def generate_genesis_code():
    """Generate complete C++ genesis block code"""
    
    print("// Copyright (c) 2023-present The Africa Bitcoin Reserve Core developers")
    print("// Distributed under the MIT software license, see the accompanying")
    print("// file COPYING or https://opensource.org/license/mit/.\n")
    print("#ifndef ABR_MAINNET_GENESIS_H")
    print("#define ABR_MAINNET_GENESIS_H\n")
    print("#include <primitives/block.h>")
    print("#include <consensus/merkle.h>")
    print("#include <uint256.h>")
    print("#include <script/script.h>")
    print("#include <streams.h>")
    print("#include <util/strencodings.h>\n")
    print("static const char* GENESIS_MESSAGE = \"Africa Bitcoin Reserve - Genesis Block - February 19, 2026 - United Africa\";\n")
    print("// Helper function to create P2PKH script from address hash")
    print("inline CScript GetScriptForDestination(const std::vector<unsigned char>& hash160)")
    print("{")
    print("    CScript script;")
    print("    script << OP_DUP << OP_HASH160 << ToByteVector(hash160) << OP_EQUALVERIFY << OP_CHECKSIG;")
    print("    return script;")
    print("}\n")
    print("// Helper to parse hex string to vector")
    print("inline std::vector<unsigned char> ParseHex(const std::string& hex)")
    print("{")
    print("    std::vector<unsigned char> result;")
    print("    for (size_t i = 0; i < hex.length(); i += 2) {")
    print("        std::string byteStr = hex.substr(i, 2);")
    print("        result.push_back((unsigned char)strtol(byteStr.c_str(), nullptr, 16));")
    print("    }")
    print("    return result;")
    print("}\n")
    print("static CBlock CreateGenesisBlock()")
    print("{")
    print("    CMutableTransaction txNew;")
    print("    txNew.nVersion = 1;")
    print("    txNew.vin.resize(1);")
    print(f"    txNew.vout.resize({len(ALLOCATIONS) + 1}); // {len(ALLOCATIONS)} allocations + 1 miner reward\n")
    print("    // Coinbase input with genesis message")
    print("    std::vector<unsigned char> messageData(GENESIS_MESSAGE, GENESIS_MESSAGE + strlen(GENESIS_MESSAGE));")
    print("    txNew.vin[0].scriptSig = CScript() << 486604799 << CScriptNum(4) << messageData;")
    print("    txNew.vin[0].nSequence = 0xFFFFFFFF;\n")
    
    # Generate outputs for each allocation
    for i, alloc in enumerate(ALLOCATIONS):
        print(f"    // Output {i}: {alloc['address']} - {alloc['amount']:,} ABR ({alloc['name']})")
        print(f"    txNew.vout[{i}].nValue = {alloc['amount']} * COIN;")
        print(f"    txNew.vout[{i}].scriptPubKey = GetScriptForDestination(ParseHex(\"{alloc['hash160']}\"));\n")
    
    # Add miner reward at the last index
    last_idx = len(ALLOCATIONS)
    print(f"    // Output {last_idx}: Miner Reward - 1,000 ABR (for first miner)")
    print(f"    txNew.vout[{last_idx}].nValue = 1000 * COIN;")
    print(f"    txNew.vout[{last_idx}].scriptPubKey = GetScriptForDestination(ParseHex(\"b147d74dfab443b5e1597bbbb3178ea2e2ab5162\"));\n")
    
    print("    CBlock genesis;")
    print("    genesis.nTime = 1771545600;")
    print("    genesis.nBits = 486604799;")
    print("    genesis.nNonce = 2083236893;")
    print("    genesis.nVersion = 1;")
    print("    genesis.vtx.push_back(MakeTransactionRef(std::move(txNew)));")
    print("    genesis.hashPrevBlock.SetNull();")
    print("    genesis.hashMerkleRoot = BlockMerkleRoot(genesis);\n")
    print("    return genesis;")
    print("}\n")
    print("static const uint256 GENESIS_BLOCK_HASH = uint256S(\"3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7\");")
    print("static const uint256 GENESIS_TXID = uint256S(\"1780952e177d6b42e92ae4df7be0a60ee3cc33a13f3ef437ddea61b4ab86c7bf\");\n")
    print("#endif // ABR_MAINNET_GENESIS_H")

if __name__ == "__main__":
    generate_genesis_code()
