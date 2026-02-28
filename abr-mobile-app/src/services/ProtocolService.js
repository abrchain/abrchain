import AsyncStorage from '@react-native-async-storage/async-storage';

const PROTOCOL_URL = 'http://localhost:8345';

class ProtocolService {
    async validateAddress(address) {
        try {
            const response = await fetch(`${PROTOCOL_URL}/protocol/validate/${address}`);
            return await response.json();
        } catch {
            return { valid: false };
        }
    }
}

export default new ProtocolService();
