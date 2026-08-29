import { apiClient } from './client';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User, VerifyOtpRequest } from '../types';

export const registerDonorApi = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
    ...data,
    role: 'DONOR', // Enforce DONOR role for public registration
  });
  return response.data.data;
};

export const loginApi = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
  return response.data.data;
};

export const verifyOtpApi = async (data: VerifyOtpRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-otp', data);
  return response.data.data;
};

export const getCurrentUserApi = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
};
