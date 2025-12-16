import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import api from '../../api';
import type { SmartOrder } from '../../api/Api';

interface OrderItem {
  id: number;
  deviceId: number;
  quantity: number;
  price: number;
}

interface Service {
  id: number;
  name: string;
  price: number;
}

interface OrderState {
  id: number | null;
  items: OrderItem[];
  services: Service[];
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'delivered';
  totalAmount: number;
  createdAt: string | null;
  loading: boolean;
  error: string | null;
  userOrders: SmartOrder[];
  draftOrder: SmartOrder | null;
  cartItemCount: number;
}

const initialState: OrderState = {
  id: null,
  items: [],
  services: [],
  status: 'draft',
  totalAmount: 0,
  createdAt: null,
  loading: false,
  error: null,
  userOrders: [],
  draftOrder: null,
  cartItemCount: 0,
};

// Async Thunk функции
export const fetchUserOrders = createAsyncThunk(
  'order/fetchUserOrders',
  async (filters: { status?: string; dateFrom?: string; dateTo?: string } | undefined, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters?.dateTo) params.append('date_to', filters.dateTo);
      
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const response = await axios.get(
        `${baseURL}/smart-orders?${params.toString()}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке заявок');
    }
  }
);

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (orderData: { address: string }, { rejectWithValue }) => {
    try {
      // Сначала создаем заявку с адресом
      const orderResponse = await api.smartOrders.smartOrdersUpdate(0, {
        address: orderData.address,
      });
      
      // Затем формируем заявку (переводим из draft в formed)
      const formedResponse = await api.smartOrders.formUpdate(orderResponse.data.id!);
      
      return formedResponse.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при создании заявки');
    }
  }
);

export const updateOrder = createAsyncThunk(
  'order/updateOrder',
  async ({ id, data }: { id: number; data: { address: string } }, { rejectWithValue }) => {
    try {
      const response = await api.smartOrders.smartOrdersUpdate(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при обновлении заявки');
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'order/deleteOrder',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.smartOrders.smartOrdersDelete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении заявки');
    }
  }
);

// Получение информации о корзине (черновой заявке)
export const fetchDraftOrder = createAsyncThunk(
  'order/fetchDraftOrder',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.smartOrders.cartList();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при загрузке корзины');
    }
  }
);

// Добавление устройства в корзину
export const addDeviceToOrder = createAsyncThunk(
  'order/addDeviceToOrder',
  async (deviceId: number, { rejectWithValue }) => {
    try {
      // Используем прямой axios запрос для POST /api/order-items
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const response = await axios.post(
        `${baseURL}/order-items`,
        {
          device_id: deviceId,
          quantity: 1
        },
        {
          withCredentials: true
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при добавлении устройства');
    }
  }
);

// Удаление устройства из корзины
export const removeDeviceFromOrder = createAsyncThunk(
  'order/removeDeviceFromOrder',
  async (deviceId: number, { rejectWithValue }) => {
    try {
      await api.orderItems.orderItemsDelete(deviceId);
      return deviceId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при удалении устройства');
    }
  }
);

// Обновление количества устройства в корзине
export const updateDeviceQuantity = createAsyncThunk(
  'order/updateDeviceQuantity',
  async ({ deviceId, quantity }: { deviceId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await api.orderItems.orderItemsUpdate(deviceId, { quantity });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при обновлении количества');
    }
  }
);

// Оформление черновой заявки
export const submitDraftOrder = createAsyncThunk(
  'order/submitDraftOrder',
  async ({ orderId, address }: { orderId: number; address: string }, { rejectWithValue }) => {
    try {
      // Сначала обновляем адрес
      await api.smartOrders.smartOrdersUpdate(orderId, { address });
      // Затем формируем заявку
      const response = await api.smartOrders.formUpdate(orderId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при оформлении заявки');
    }
  }
);

// Завершение заявки модератором
export const completeOrder = createAsyncThunk(
  'order/completeOrder',
  async (orderId: number, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const response = await axios.put(
        `${baseURL}/smart-orders/${orderId}/complete`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при завершении заявки');
    }
  }
);

// Отклонение заявки модератором
export const rejectOrder = createAsyncThunk(
  'order/rejectOrder',
  async (orderId: number, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const response = await axios.put(
        `${baseURL}/smart-orders/${orderId}/reject`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при отклонении заявки');
    }
  }
);

// Запуск асинхронного расчета трафика
export const calculateTraffic = createAsyncThunk(
  'order/calculateTraffic',
  async (orderId: number, { rejectWithValue }) => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const response = await axios.put(
        `${baseURL}/smart-orders/${orderId}/calculate-traffic`,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка при запуске расчета трафика');
    }
  }
);

export const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<OrderItem>) => {
      const existingItem = state.items.find(item => item.deviceId === action.payload.deviceId);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
                         state.services.reduce((sum, service) => sum + service.price, 0);
    },
    removeItem: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
                         state.services.reduce((sum, service) => sum + service.price, 0);
    },
    updateItemQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        state.totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) +
                           state.services.reduce((sum, service) => sum + service.price, 0);
      }
    },
    clearOrder: (state) => {
      state.id = null;
      state.items = [];
      state.services = [];
      state.status = 'draft';
      state.totalAmount = 0;
      state.createdAt = null;
    },
    submitOrder: (state) => {
      state.status = 'submitted';
      state.createdAt = new Date().toISOString();
    },
    addService: (state, action: PayloadAction<Service>) => {
      const existingService = state.services.find(service => service.id === action.payload.id);
      if (!existingService) {
        state.services.push(action.payload);
        state.totalAmount += action.payload.price;
      }
    },
    removeService: (state, action: PayloadAction<number>) => {
      const serviceIndex = state.services.findIndex(service => service.id === action.payload);
      if (serviceIndex !== -1) {
        const service = state.services[serviceIndex];
        state.totalAmount -= service.price;
        state.services.splice(serviceIndex, 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserOrders
      .addCase(fetchUserOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action: PayloadAction<SmartOrder[]>) => {
        state.loading = false;
        state.userOrders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createOrder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action: PayloadAction<SmartOrder>) => {
        state.loading = false;
        // Добавляем новую заявку в список заявок пользователя
        state.userOrders.push(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateOrder
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action: PayloadAction<SmartOrder>) => {
        state.loading = false;
        // Обновляем заявку в списке заявок пользователя
        const index = state.userOrders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.userOrders[index] = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // deleteOrder
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        // Удаляем заявку из списка заявок пользователя
        state.userOrders = state.userOrders.filter(order => order.id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchDraftOrder
      .addCase(fetchDraftOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftOrder.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.cartItemCount = action.payload.count || 0;
        // Если есть order_id, загружаем полную информацию о заявке
        if (action.payload.order_id) {
          state.id = action.payload.order_id;
        }
      })
      .addCase(fetchDraftOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.cartItemCount = 0;
      })
      // addDeviceToOrder
      .addCase(addDeviceToOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDeviceToOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addDeviceToOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // removeDeviceFromOrder
      .addCase(removeDeviceFromOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeDeviceFromOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeDeviceFromOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updateDeviceQuantity
      .addCase(updateDeviceQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDeviceQuantity.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateDeviceQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // submitDraftOrder
      .addCase(submitDraftOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitDraftOrder.fulfilled, (state, action: PayloadAction<SmartOrder>) => {
        state.loading = false;
        // Добавляем оформленную заявку в список
        state.userOrders.push(action.payload);
        // Очищаем корзину
        state.draftOrder = null;
        state.cartItemCount = 0;
        state.id = null;
      })
      .addCase(submitDraftOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // completeOrder
      .addCase(completeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeOrder.fulfilled, (state, action: PayloadAction<SmartOrder>) => {
        state.loading = false;
        // Обновляем заявку в списке
        const index = state.userOrders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.userOrders[index] = action.payload;
        }
      })
      .addCase(completeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // rejectOrder
      .addCase(rejectOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectOrder.fulfilled, (state, action: PayloadAction<SmartOrder>) => {
        state.loading = false;
        // Обновляем заявку в списке
        const index = state.userOrders.findIndex(order => order.id === action.payload.id);
        if (index !== -1) {
          state.userOrders[index] = action.payload;
        }
      })
      .addCase(rejectOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // calculateTraffic
      .addCase(calculateTraffic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateTraffic.fulfilled, (state) => {
        state.loading = false;
        // Расчет запущен, результаты придут асинхронно
      })
      .addCase(calculateTraffic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addItem, removeItem, updateItemQuantity, clearOrder, submitOrder, addService, removeService } = orderSlice.actions;

export default orderSlice.reducer;
