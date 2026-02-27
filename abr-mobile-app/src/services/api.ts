// src/services/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:9332';
const IDENTITY_API_URL = 'http://localhost:3020';
const TAX_API_URL = 'http://localhost:3023';
const CUSTOMS_API_URL = 'http://localhost:3022';
const IMMIGRATION_API_URL = 'http://localhost:3024';

class APIService {
  private static instance: APIService;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): APIService {
    if (!APIService.instance) {
      APIService.instance = new APIService();
    }
    return APIService.instance;
  }

  async init() {
    this.token = await SecureStore.getItemAsync('authToken');
  }

  private async getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  // ABR Core API
  async getBalance(address: string) {
    const response = await axios.get(`${API_BASE_URL}/api/address/${address}`);
    return response.data;
  }

  async sendTransaction(to: string, amount: number, currency: string) {
    const headers = await this.getHeaders();
    const response = await axios.post(
      `${API_BASE_URL}/api/send`,
      { to, amount, currency },
      { headers }
    );
    return response.data;
  }

  // Identity API
  async createDID(address: string, nationalId: string, nationCode: number) {
    const response = await axios.post(`${IDENTITY_API_URL}/api/v1/did/create`, {
      address,
      nationalId,
      nationCode,
    });
    return response.data;
  }

  async getDID(did: string) {
    const response = await axios.get(`${IDENTITY_API_URL}/api/v1/did/${did}`);
    return response.data;
  }

  async getCredentials(did: string) {
    const response = await axios.get(`${IDENTITY_API_URL}/api/v1/credentials/${did}`);
    return response.data;
  }

  // Tax API
  async getTaxAssessments(did: string) {
    const response = await axios.get(`${TAX_API_URL}/api/v1/tax/assessments/${did}`);
    return response.data;
  }

  async payTax(assessmentId: number, method: string) {
    const headers = await this.getHeaders();
    const response = await axios.post(
      `${TAX_API_URL}/api/v1/tax/pay`,
      { assessmentId, method },
      { headers }
    );
    return response.data;
  }

  // Customs API
  async submitDeclaration(data: any) {
    const headers = await this.getHeaders();
    const response = await axios.post(
      `${CUSTOMS_API_URL}/api/v1/customs/declare`,
      data,
      { headers }
    );
    return response.data;
  }

  async getDeclarations(did: string) {
    const response = await axios.get(`${CUSTOMS_API_URL}/api/v1/customs/declarations/${did}`);
    return response.data;
  }

  // Immigration API
  async applyVisa(data: any) {
    const headers = await this.getHeaders();
    const response = await axios.post(
      `${IMMIGRATION_API_URL}/api/v1/immigration/visa/apply`,
      data,
      { headers }
    );
    return response.data;
  }

  async getVisaStatus(applicationId: string) {
    const response = await axios.get(`${IMMIGRATION_API_URL}/api/v1/immigration/visa/${applicationId}`);
    return response.data;
  }

  async processBorderCrossing(data: any) {
    const headers = await this.getHeaders();
    const response = await axios.post(
      `${IMMIGRATION_API_URL}/api/v1/immigration/border`,
      data,
      { headers }
    );
    return response.data;
  }
}

export default APIService.getInstance();
