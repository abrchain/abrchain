// src/store/walletSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

interface WalletState {
  abrBalance: number;
  eafrBalance: number;
  addresses: string[];
  transactions: any[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  abrBalance: 0,
  eafrBalance: 0,
  addresses: [],
  transactions: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchBalances = createAsyncThunk(
  'wallet/fetchBalances',
  async (address: string) => {
    const response = await axios.get(`http://localhost:9332/api/address/${address}`);
    return response.data;
  }
);

export const sendTransaction = createAsyncThunk(
  'wallet/sendTransaction',
  async ({ to, amount, currency }: { to: string; amount: number; currency: string }) => {
    const response = await axios.post('http://localhost:9332/api/send', {
      to,
      amount,
      currency
    });
    return response.data;
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setAddresses: (state, action) => {
      state.addresses = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalances.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.loading = false;
        state.abrBalance = action.payload.abr;
        state.eafrBalance = action.payload.eafr;
      })
      .addCase(fetchBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch balances';
      })
      .addCase(sendTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      });
  },
});

export const { setAddresses, clearError } = walletSlice.actions;
export default walletSlice.reducer;
