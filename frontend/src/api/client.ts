import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let inMemoryToken: string | null = localStorage.getItem('dc-token');
let logoutCallback: (() => void) | null = null;

export const setAuthTokenInMemory = (token: string | null) => {
  inMemoryToken = token;
  if (token) {
    localStorage.setItem('dc-token', token);
  } else {
    localStorage.removeItem('dc-token');
  }
};

export const registerLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

// Request Interceptor: Attach JWT Bearer token
apiClient.interceptors.request.use((config) => {
  const activeToken = inMemoryToken || localStorage.getItem('dc-token');
  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }
  return config;
});

// Response Interceptor: Catch 401 Unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && logoutCallback) {
      logoutCallback();
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);
