import axios from 'axios';
import { SystemHealthResponse } from '@/src/types';

// Create base Axios instance
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'Unable to connect to the clearance backend service.',
      status: error.response?.status || 500,
      data: error.response?.data,
    };
    return Promise.reject(customError);
  }
);

// Health check service API
export const checkSystemHealth = async (): Promise<SystemHealthResponse> => {
  const response = await apiClient.get<SystemHealthResponse>('/health');
  return response.data;
};
