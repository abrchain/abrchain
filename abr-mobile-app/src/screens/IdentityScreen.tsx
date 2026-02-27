// src/screens/IdentityScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const IdentityScreen = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [didDocument, setDidDocument] = useState<any>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [nationCode, setNationCode] = useState('');
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometrics();
    loadIdentity();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (compatible && enrolled) {
      if (types.includes(1)) setBiometricType('Fingerprint');
      else if (types.includes(2)) setBiometricType('Face ID');
    }
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your digital ID',
        fallbackLabel: 'Use PIN',
      });
      
      if (result.success) {
        setIsAuthenticated(true);
        loadIdentity();
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    }
  };

  const loadIdentity = async () => {
    try {
      const did = await SecureStore.getItemAsync('userDid');
      if (did) {
        const response = await axios.get(`http://localhost:3020/api/v1/did/${did}`);
        setDidDocument(response.data);
        
        const creds = await axios.get(`http://localhost:3020/api/v1/credentials/${did}`);
        setCredentials(creds.data);
      }
    } catch (error) {
      console.log('No identity found');
    }
  };

  const createIdentity = async () => {
    try {
      const address = await SecureStore.getItemAsync('abrAddress');
      const response = await axios.post('http://localhost:3020/api/v1/did/create', {
        address,
        nationalId,
        nationCode: parseInt(nationCode),
      });
      
      await SecureStore.setItemAsync('userDid', response.data.did);
      setDidDocument(response.data);
      setShowCreateModal(false);
      Alert.alert('Success', 'Digital identity created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create identity');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Icon name="fingerprint" size={80} color="#667eea" />
        <Text style={styles.authTitle}>Secure Access</Text>
        <Text style={styles.authSubtitle}>
          Authenticate with {biometricType || 'biometrics'} to access your digital ID
        </Text>
        <TouchableOpacity style={styles.authButton} onPress={authenticate}>
          <Text style={styles.authButtonText}>Authenticate</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!didDocument) {
    return (
      <View style={styles.container}>
        <View style={styles.createContainer}>
          <Icon name="assignment-ind" size={60} color="#667eea" />
          <Text style={styles.createTitle}>Create Your Digital Identity</Text>
          <Text style={styles.createSubtitle}>
            Your sovereign identity for all African services
          </Text>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>Create Digital ID</Text>
          </TouchableOpacity>
        </View>

        {/* Create Identity Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Digital Identity</Text>
              
              <TextInput
                style={styles.input}
                placeholder="National ID Number"
                value={nationalId}
                onChangeText={setNationalId}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Nation Code (e.g., 566 for Nigeria)"
                value={nationCode}
                onChangeText={setNationCode}
                keyboardType="numeric"
              />
              
              <TouchableOpacity style={styles.modalButton} onPress={createIdentity}>
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* DID Card */}
      <View style={styles.didCard}>
        <View style={styles.didHeader}>
          <Icon name="verified-user" size={30} color="#48bb78" />
          <Text style={styles.verifiedBadge}>Verified</Text>
        </View>
        
        <Text style={styles.didLabel}>Decentralized Identifier</Text>
        <Text style={styles.didValue}>{didDocument.id}</Text>
        
        <View style={styles.didRow}>
          <View style={styles.didInfo}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {new Date(didDocument.created).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.didInfo}>
            <Text style={styles.infoLabel}>Nation</Text>
            <Text style={styles.infoValue}>{didDocument.nationCode}</Text>
          </View>
        </View>
      </View>

      {/* Verifiable Credentials */}
      <View style={styles.credentialsContainer}>
        <Text style={styles.sectionTitle}>Verifiable Credentials</Text>
        
        {credentials.map((cred) => (
          <View key={cred.id} style={styles.credentialCard}>
            <View style={styles.credentialHeader}>
              <Icon name="badge" size={24} color="#667eea" />
              <Text style={styles.credentialType}>{cred.type}</Text>
            </View>
            
            <View style={styles.credentialBody}>
              {Object.entries(cred.claims).map(([key, value]) => (
                <View key={key} style={styles.claimRow}>
                  <Text style={styles.claimKey}>{key}:</Text>
                  <Text style={styles.claimValue}>{String(value)}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.credentialFooter}>
              <Text style={styles.credentialDate}>
                Issued: {new Date(cred.issuedAt).toLocaleDateString()}
              </Text>
              {cred.expiresAt && (
                <Text style={styles.credentialExpiry}>
                  Expires: {new Date(cred.expiresAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="qr-code-scanner" size={24} color="#667eea" />
          <Text style={styles.actionItemText}>Share Credential</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="add-circle" size={24} color="#667eea" />
          <Text style={styles.actionItemText}>Request New</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="history" size={24} color="#667eea" />
          <Text style={styles.actionItemText}>Verification History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  authButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  createSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  didCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  didHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  verifiedBadge: {
    backgroundColor: '#48bb78',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    fontSize: 12,
  },
  didLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  didValue: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
  },
  didRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  didInfo: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  credentialsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  credentialCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  credentialType: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  credentialBody: {
    marginBottom: 10,
  },
  claimRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  claimKey: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  claimValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  credentialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  credentialDate: {
    fontSize: 12,
    color: '#999',
  },
  credentialExpiry: {
    fontSize: 12,
    color: '#f56565',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionItemText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    color: '#666',
  },
});

export default IdentityScreen;
