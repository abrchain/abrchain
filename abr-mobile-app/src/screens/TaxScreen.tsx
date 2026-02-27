// src/screens/TaxScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TaxScreen = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTaxAssessments();
  }, []);

  const loadTaxAssessments = async () => {
    try {
      const did = await SecureStore.getItemAsync('userDid');
      const response = await axios.get(`http://localhost:3023/api/v1/tax/assessments/${did}`);
      setAssessments(response.data);
    } catch (error) {
      console.log('Failed to load tax assessments');
    }
  };

  const payTax = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:3023/api/v1/tax/pay', {
        assessmentId: selectedAssessment.id,
        method: paymentMethod,
      });
      
      Alert.alert('Success', 'Tax payment successful');
      setShowPaymentModal(false);
      loadTaxAssessments();
    } catch (error) {
      Alert.alert('Error', 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#48bb78';
      case 'PENDING': return '#fbbf24';
      case 'OVERDUE': return '#f56565';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Tax Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Due</Text>
            <Text style={styles.summaryValue}>₦ 150,000</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>₦ 75,000</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>₦ 75,000</Text>
          </View>
        </View>
      </View>

      {/* Tax Types */}
      <View style={styles.taxTypes}>
        <TouchableOpacity style={[styles.taxType, styles.activeTaxType]}>
          <Text style={styles.taxTypeText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.taxType}>
          <Text style={styles.taxTypeText}>VAT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.taxType}>
          <Text style={styles.taxTypeText}>Corporate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.taxType}>
          <Text style={styles.taxTypeText}>Personal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.taxType}>
          <Text style={styles.taxTypeText}>Customs</Text>
        </TouchableOpacity>
      </View>

      {/* Assessments List */}
      <View style={styles.assessmentsContainer}>
        <Text style={styles.sectionTitle}>Tax Assessments</Text>
        
        {assessments.map((assessment) => (
          <View key={assessment.id} style={styles.assessmentCard}>
            <View style={styles.assessmentHeader}>
              <View>
                <Text style={styles.assessmentType}>{assessment.type}</Text>
                <Text style={styles.assessmentPeriod}>{assessment.period}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assessment.status) }]}>
                <Text style={styles.statusText}>{assessment.status}</Text>
              </View>
            </View>
            
            <View style={styles.assessmentBody}>
              <View style={styles.assessmentRow}>
                <Text style={styles.assessmentLabel}>Amount Due</Text>
                <Text style={styles.assessmentAmount}>₦ {assessment.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.assessmentRow}>
                <Text style={styles.assessmentLabel}>Due Date</Text>
                <Text style={styles.assessmentDate}>
                  {new Date(assessment.dueDate).toLocaleDateString()}
                </Text>
              </View>
              {assessment.penalty > 0 && (
                <View style={styles.assessmentRow}>
                  <Text style={styles.assessmentLabel}>Penalty</Text>
                  <Text style={styles.assessmentPenalty}>₦ {assessment.penalty.toLocaleString()}</Text>
                </View>
              )}
            </View>
            
            {assessment.status !== 'PAID' && (
              <TouchableOpacity 
                style={styles.payButton}
                onPress={() => {
                  setSelectedAssessment(assessment);
                  setShowPaymentModal(true);
                }}
              >
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Payment Modal */}
      {showPaymentModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pay Tax Assessment</Text>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalAmount}>
                Amount: ₦ {selectedAssessment?.amount.toLocaleString()}
              </Text>
              
              <Text style={styles.paymentMethodLabel}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                <TouchableOpacity
                  style={[styles.paymentMethod, paymentMethod === 'wallet' && styles.selectedMethod]}
                  onPress={() => setPaymentMethod('wallet')}
                >
                  <Icon name="account-balance-wallet" size={24} color="#667eea" />
                  <Text style={styles.paymentMethodText}>ABR Wallet</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.paymentMethod, paymentMethod === 'bank' && styles.selectedMethod]}
                  onPress={() => setPaymentMethod('bank')}
                >
                  <Icon name="account-balance" size={24} color="#667eea" />
                  <Text style={styles.paymentMethodText}>Bank Transfer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.paymentMethod, paymentMethod === 'card' && styles.selectedMethod]}
                  onPress={() => setPaymentMethod('card')}
                >
                  <Icon name="credit-card" size={24} color="#667eea" />
                  <Text style={styles.paymentMethodText}>Card</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={payTax}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Processing...' : 'Confirm Payment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryCard: {
    backgroundColor: '#667eea',
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 5,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taxTypes: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  taxType: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  activeTaxType: {
    backgroundColor: '#667eea',
  },
  taxTypeText: {
    fontSize: 14,
    color: '#333',
  },
  assessmentsContainer: {
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
  assessmentCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assessmentType: {
    fontSize: 16,
    fontWeight: '600',
  },
  assessmentPeriod: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  assessmentBody: {
    marginBottom: 15,
  },
  assessmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  assessmentLabel: {
    fontSize: 14,
    color: '#666',
  },
  assessmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  assessmentDate: {
    fontSize: 14,
    color: '#666',
  },
  assessmentPenalty: {
    fontSize: 14,
    color: '#f56565',
  },
  payButton: {
    backgroundColor: '#48bb78',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalAmount: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentMethodLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paymentMethod: {
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '30%',
  },
  selectedMethod: {
    backgroundColor: '#f0f4ff',
    borderColor: '#667eea',
  },
  paymentMethodText: {
    marginTop: 5,
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaxScreen;
