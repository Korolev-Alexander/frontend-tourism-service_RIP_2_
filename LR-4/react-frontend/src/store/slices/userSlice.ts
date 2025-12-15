import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: number | null;
  username: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isModerator: boolean;
  token: string | null;
}

const initialState: UserState = {
  id: null,
  username: null,
  email: null,
  isAuthenticated: false,
  isModerator: false,
  token: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ id: number; username: string; email: string; token: string; isModerator?: boolean }>) => {
      state.id = action.payload.id;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.token = action.payload.token;
      state.isModerator = action.payload.isModerator || false;
      state.isAuthenticated = true;
    },
    clearUser: (state) => {
      state.id = null;
      state.username = null;
      state.email = null;
      state.token = null;
      state.isModerator = false;
      state.isAuthenticated = false;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
  },
});

export const { setUser, clearUser, setToken } = userSlice.actions;

export default userSlice.reducer;
