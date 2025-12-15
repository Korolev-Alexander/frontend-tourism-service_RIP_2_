export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface Device {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  deviceId: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  items: OrderItem[];
  status: 'draft' | 'formed' | 'completed' | 'deleted';
  address: string;
  total_traffic: number;
  traffic_calculated: boolean;
  client_id: number;
  client_name: string;
  formed_at?: string;
  completed_at?: string;
  moderator_id?: number;
  moderator_name?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface OrderState {
  currentOrder: Order | null;
  orderHistory: Order[];
}
