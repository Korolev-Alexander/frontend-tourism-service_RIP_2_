import type { SmartDevice, SmartOrder, Client, DeviceFilter } from '../types';
import { BASE_API_URL } from '../target_config';

// Единая точка конфигурации API через target_config.ts
const API_BASE_URL = BASE_API_URL;

// Расширенное логирование для отладки
console.log('📡 API Service initialized');
console.log('🔗 Base API URL:', API_BASE_URL);
console.log('🌍 Window location:', typeof window !== 'undefined' ? window.location.href : 'N/A');
console.log('🔧 Tauri detected:', typeof window !== 'undefined' && '__TAURI__' in window);

export const api = {
  // ===== DEVICES =====
  async getDevices(filters?: DeviceFilter): Promise<SmartDevice[]> {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.protocol) queryParams.append('protocol', filters.protocol);

    const url = `${API_BASE_URL}/smart-devices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('🔍 Fetching devices from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('❌ Failed to fetch devices:', response.status, response.statusText);
      throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Devices loaded:', data.length, 'items');
    return data;
  },

  async getDevice(id: number): Promise<SmartDevice> {
    const url = `${API_BASE_URL}/smart-devices/${id}`;
    console.log('🔍 Fetching device from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('❌ Failed to fetch device:', response.status, response.statusText);
      throw new Error(`Failed to fetch device: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Device loaded:', data);
    return data;
  },

  // ===== ORDERS =====
  async getOrders(): Promise<SmartOrder[]> {
    const url = `${API_BASE_URL}/smart-orders`;
    console.log('🔍 Fetching orders from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('❌ Failed to fetch orders:', response.status, response.statusText);
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Orders loaded:', data.length, 'items');
    return data;
  },

  // ===== CLIENTS =====
  async getClients(): Promise<Client[]> {
    const url = `${API_BASE_URL}/clients`;
    console.log('🔍 Fetching clients from:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('❌ Failed to fetch clients:', response.status, response.statusText);
      throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Clients loaded:', data.length, 'items');
    return data;
  }
};
