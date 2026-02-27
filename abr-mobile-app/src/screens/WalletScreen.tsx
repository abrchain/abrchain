// src/screens/WalletScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { Camera } from 'expo-camera';
import { useDispatch, useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { fetchBalances, sendTransaction } from '../store/walletSlice';

const WalletScreen = () => {
  const dispatch = useDispatch();
  const { abrBalance, eafrBalance, transactions, loading } = useSelector(
    (state: any) => state.wallet
  );
  
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCurrency, setSendCurrency] = useState('ABR');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const userAddress = '1HANfZH6ZF7UfMkJ6F3tgZmyfyptoVGHPQ'; // From secure store

  useEffect(() => {
    loadWalletData();
    requestCameraPermission();
  }, []);

  const loadWalletData = async () => {
    dispatch(fetchBalances(userAddress) as any);
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleSend = async () => {
    if (!sendAddress || !sendAmount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await dispatch(
        sendTransaction({
          to: sendAddress,
          amount: parseFloat(sendAmount),
          currency: sendCurrency,
        }) as any
      );
      Alert.alert('Success', 'Transaction sent successfully');
      setShowSendModal(false);
      setSendAddress('');
      setSendAmount('');
      loadWalletData();
    } catch (error) {
      Alert.alert('Error', 'Transaction failed');
    }
  };

  const formatSatoshi = (value: number) => {
    return (value / 100000000).toFixed(8);
  };

  const formatLocalCurrency = (value: number) => {
    return (value * 65000).toFixed(2); // Example USD rate
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadWalletData} />
      }
    >
      {/* Balance Cards */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>ABR Balance</Text>
          <Text style={styles.balanceValue}>{formatSatoshi(abrBalance)} ABR</Text>
          <Text style={styles.balanceUSD}>≈ ${formatLocalCurrency(abrBalance)}</Text>
          <Text style={styles.satoshiValue}>{abrBalance.toLocaleString()} satoshis</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>eAFR Balance</Text>
          <Text style={styles.balanceValue}>{eafrBalance.toFixed(2)} eAFR</Text>
          <Text style={styles.balanceUSD}>≈ ${(eafrBalance).toFixed(2)}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowSendModal(true)}
        >
          <Icon name="send" size={24} color="#667eea" />
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowReceiveModal(true)}
        >
          <Icon name="qr-code" size={24} color="#667eea" />
          <Text style={styles.actionText}>Receive</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowQRScanner(true)}
        >
          <Icon name="camera-alt" size={24} color="#667eea" />
          <Text style={styles.actionText}>Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="swap-horiz" size={24} color="#667eea" />
          <Text style={styles.actionText}>Swap</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.slice(0, 5).map((tx: any) => (
          <View key={tx.id} style={styles.transactionItem}>
            <Icon 
              name={tx.type === 'send' ? 'arrow-upward' : 'arrow-downward'} 
              size={20} 
              color={tx.type === 'send' ? '#f56565' : '#48bb78'} 
            />
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionAddress}>
                {tx.type === 'send' ? `To: ${tx.to.slice(0, 10)}...` : `From: ${tx.from.slice(0, 10)}...`}
              </Text>
              <Text style={styles.transactionDate}>
                {new Date(tx.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: tx.type === 'send' ? '#f56565' : '#48bb78' }
            ]}>
              {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.currency}
            </Text>
          </View>
        ))}
      </View>

      {/* Send Modal */}
      <Modal visible={showSendModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Payment</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Recipient Address"
              value={sendAddress}
              onChangeText={setSendAddress}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={sendAmount}
              onChangeText={setSendAmount}
              keyboardType="numeric"
            />
            
            <View style={styles.currencySelector}>
              <TouchableOpacity
                style={[styles.currencyOption, sendCurrency === 'ABR' && styles.selectedCurrency]}
                onPress={() => setSendCurrency('ABR')}
              >
                <Text>ABR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyOption, sendCurrency === 'eAFR' && styles.selectedCurrency]}
                onPress={() => setSendCurrency('eAFR')}
              >
                <Text>eAFR</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleSend}>
              <Text style={styles.modalButtonText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowSendModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Receive Modal */}
      <Modal visible={showReceiveModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Receive Payment</Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={userAddress}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            
            <Text style={styles.addressText}>{userAddress}</Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                // Copy to clipboard
              }}
            >
              <Text style={styles.modalButtonText}>Copy Address</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowReceiveModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceContainer: {
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceUSD: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
  },
  satoshiValue: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  transactionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 10,
  },
  transactionAddress: {
    fontSize: 14,
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
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
    maxWidth: 400,
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
    fontSize: 16,
  },
  currencySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  currencyOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  selectedCurrency: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
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
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default WalletScreen;
