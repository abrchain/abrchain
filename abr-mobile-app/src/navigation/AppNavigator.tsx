// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import WalletScreen from '../screens/WalletScreen';
import IdentityScreen from '../screens/IdentityScreen';
import ServicesScreen from '../screens/ServicesScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import TaxScreen from '../screens/TaxScreen';
import CustomsScreen from '../screens/CustomsScreen';
import ImmigrationScreen from '../screens/ImmigrationScreen';
import TradeScreen from '../screens/TradeScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ABR Dashboard' }} />
    <Stack.Screen name="Payments" component={PaymentsScreen} />
    <Stack.Screen name="Trade" component={TradeScreen} />
  </Stack.Navigator>
);

const ServicesStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Services" component={ServicesScreen} />
    <Stack.Screen name="Tax" component={TaxScreen} />
    <Stack.Screen name="Customs" component={CustomsScreen} />
    <Stack.Screen name="Immigration" component={ImmigrationScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Wallet') iconName = 'account-balance-wallet';
            else if (route.name === 'Identity') iconName = 'fingerprint';
            else if (route.name === 'Services') iconName = 'grid-view';
            else if (route.name === 'Settings') iconName = 'settings';
            
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#667eea',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Wallet" component={WalletScreen} />
        <Tab.Screen name="Identity" component={IdentityScreen} />
        <Tab.Screen name="Services" component={ServicesStack} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
