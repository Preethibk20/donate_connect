import { apiClient } from './client';
import { AdminStats, ApiResponse, NGOProfile, User } from '../types';

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
  return response.data.data;
};

export const getAllNgosAdmin = async (): Promise<NGOProfile[]> => {
  const response = await apiClient.get<ApiResponse<NGOProfile[]>>('/admin/ngo');
  return response.data.data;
};

export const getPendingUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/admin/users/pending');
  return response.data.data;
};

export const approveUser = async (id: string): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}/approve`);
  return response.data.data;
};
