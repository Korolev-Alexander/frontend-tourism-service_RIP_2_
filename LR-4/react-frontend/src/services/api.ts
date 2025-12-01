import type { SmartDevice, SmartOrder, Client, DeviceFilter } from '../types';

// Для разработки: прокси через Vite
// Для production и Tauri: прямой доступ к API серверу
const API_BASE_URL = import.meta.env.PROD || import.meta.env.TAURI_ENV_PLATFORM
  ? 'http://192.168.1.12:8080/api'  // Замените на ваш локальный IP
  : '/api';

export const api = {
  // ===== DEVICES =====
  async getDevices(filters?: DeviceFilter): Promise<SmartDevice[]> {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.protocol) queryParams.append('protocol', filters.protocol);

    const url = `${API_BASE_URL}/smart-devices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch devices');
      return response.json();
    } catch (error) {
      console.error('API error, using mock data:', error);
      // Mock данные для демонстрации
      return [
        {
          id: 1,
          name: 'Умная лампочка',
          model: 'Яндекс, E27',
          avg_data_rate: 8,
          data_per_hour: 0.5,
          namespace_url: '',
          description: 'Умная лампочка Яндекс, E27',
          description_all: 'Умная Яндекс лампочка позволяет дистанционно управлять освещением',
          protocol: 'Wi-Fi',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Умная розетка',
          model: 'YNDX-00340',
          avg_data_rate: 2,
          data_per_hour: 0.1,
          namespace_url: '',
          description: 'Умная розетка Яндекс YNDX-00340',
          description_all: 'Умная розетка для дистанционного управления электроприборами',
          protocol: 'Wi-Fi',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
    }
  },

  async getDevice(id: number): Promise<SmartDevice> {
    try {
      const response = await fetch(`${API_BASE_URL}/smart-devices/${id}`);
      if (!response.ok) throw new Error('Failed to fetch device');
      return response.json();
    } catch (error) {
      console.error('API error:', error);
      // Mock данные
      return {
        id,
        name: 'Mock Device',
        model: 'Mock Model',
        avg_data_rate: 10,
        data_per_hour: 1,
        namespace_url: '',
        description: 'Mock description',
        description_all: 'Mock full description',
        protocol: 'Wi-Fi',
        is_active: true,
        created_at: new Date().toISOString()
      };
    }
  },

  // ===== ORDERS =====
  async getOrders(): Promise<SmartOrder[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/smart-orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  },

  // ===== CLIENTS =====
  async getClients(): Promise<Client[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/clients`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    } catch (error) {
      console.error('API error:', error);
      return [];
    }
  }
};