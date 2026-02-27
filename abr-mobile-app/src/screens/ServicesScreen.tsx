// src/screens/ServicesScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const ServicesScreen = () => {
  const navigation = useNavigation();

  const services = [
    {
      id: 'tax',
      title: 'Tax Payment',
      icon: 'receipt',
      color: '#48bb78',
      screen: 'Tax',
      description: 'Pay VAT, corporate, and personal taxes',
    },
    {
      id: 'customs',
      title: 'Customs',
      icon: 'local-shipping',
      color: '#fbbf24',
      screen: 'Customs',
      description: 'Import/export declarations and duties',
    },
    {
      id: 'immigration',
      title: 'Immigration',
      icon: 'flight',
      color: '#f56565',
      screen: 'Immigration',
      description: 'Visa applications and border control',
    },
    {
      id: 'trade',
      title: 'Trade Finance',
      icon: 'trending-up',
      color: '#9f7aea',
      screen: 'Trade',
      description: 'Cross-border trade settlement',
    },
    {
      id: 'remittance',
      title: 'Remittance',
      icon: 'swap-horiz',
      color: '#ed8936',
      screen: 'Remittance',
      description: 'Send money across Africa',
    },
    {
      id: 'business',
      title: 'Business Registration',
      icon: 'business',
      color: '#667eea',
      screen: 'Business',
      description: 'Register and manage businesses',
    },
    {
      id: 'education',
      title: 'Education',
      icon: 'school',
      color: '#38b2ac',
      screen: 'Education',
      description: 'Verify certificates and pay fees',
    },
    {
      id: 'health',
      title: 'Healthcare',
      icon: 'local-hospital',
      color: '#f687b3',
      screen: 'Health',
      description: 'Health insurance and records',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="qr-code-scanner" size={24} color="#fff" />
          <Text style={styles.quickActionText}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="payment" size={24} color="#fff" />
          <Text style={styles.quickActionText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="history" size={24} color="#fff" />
          <Text style={styles.quickActionText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <Icon name="support-agent" size={24} color="#fff" />
          <Text style={styles.quickActionText}>Support</Text>
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      <View style={styles.servicesGrid}>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            onPress={() => navigation.navigate(service.screen as never)}
          >
            <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
              <Icon name={service.icon} size={30} color="#fff" />
            </View>
            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#667eea',
    padding: 15,
    marginBottom: 20,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  serviceCard: {
    width: '50%',
    padding: 10,
  },
  serviceIcon: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
  },
});

export default ServicesScreen;
