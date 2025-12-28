import type { SmartDevice, SmartOrder, Client, DeviceFilter } from '../types';

// Простое и надежное определение режима через Vite MODE
// production = Tauri build, development = браузер dev
const getBaseApiUrl = () => {
  if (import.meta.env.MODE === 'production') {
    // Production mode = Tauri build → используем прямой IP
    return 'http://192.168.1.12:8082/api';
  }
  // Development mode = браузер → используем proxy
  return '/api';
};

const getBaseImgUrl = () => {
  if (import.meta.env.MODE === 'production') {
    // Production mode = Tauri build → используем прямой IP
    return 'http://192.168.1.12:9000';
  }
  // Development mode = браузер → используем proxy
  return '/img-proxy';
};

// Расширенное логирование для отладки
console.log('📡 API Service initialized');
console.log('🔧 Mode:', import.meta.env.MODE);
console.log('🔗 Base API URL:', getBaseApiUrl());
console.log('️ Base IMG URL:', getBaseImgUrl());

export const api = {
  // ===== DEVICES =====
  async getDevices(filters?: DeviceFilter): Promise<SmartDevice[]> {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.protocol) queryParams.append('protocol', filters.protocol);

    const url = `${getBaseApiUrl()}/smart-devices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
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
    const url = `${getBaseApiUrl()}/smart-devices/${id}`;
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
    const url = `${getBaseApiUrl()}/smart-orders`;
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
    const url = `${getBaseApiUrl()}/clients`;
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

// Экспортируем функции для использования в компонентах
export { getBaseApiUrl, getBaseImgUrl };
