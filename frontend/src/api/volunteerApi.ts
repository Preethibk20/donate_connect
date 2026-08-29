import { apiClient } from './client';
import { ApiResponse, Donation, PageResponse, VolunteerTask } from '../types';

export const getMyVolunteerTasks = async (): Promise<VolunteerTask[]> => {
  const response = await apiClient.get<ApiResponse<VolunteerTask[]>>('/volunteer/pickups');
  return response.data.data;
};

export const getAvailablePickups = async (page = 0, size = 20): Promise<PageResponse<Donation>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Donation>>>(
    `/volunteer/pickups/available?page=${page}&size=${size}`
  );
  return response.data.data;
};

export const claimVolunteerPickup = async (donationId: string): Promise<VolunteerTask> => {
  const response = await apiClient.post<ApiResponse<VolunteerTask>>(`/volunteer/pickups/${donationId}/claim`);
  return response.data.data;
};

export const updateVolunteerTaskStatus = async (
  taskId: string,
  status: 'CLAIMED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
): Promise<VolunteerTask> => {
  const response = await apiClient.patch<ApiResponse<VolunteerTask>>(
    `/volunteer/pickups/${taskId}/status?status=${status}`
  );
  return response.data.data;
};
