#!/usr/bin/env python3
import sys
sys.path.append('shared/protocol-client')
from protocol_client import ABRProtocolClient

class ProtocolValidator:
    def __init__(self):
        self.protocol = ABRProtocolClient()
    
    def validate_trade(self, trade):
        # Check if address is genesis
        if 'address' in trade:
            addr_check = self.protocol.validate_address(trade['address'])
            if addr_check['valid']:
                trade['genesis_allocation'] = addr_check
        return True, "Trade validated"
