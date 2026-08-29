import { apiClient } from './client';
import { ApiResponse, CorporateDrive } from '../types';

export const getCorporateDrives = async (): Promise<CorporateDrive[]> => {
  const response = await apiClient.get<ApiResponse<CorporateDrive[]>>('/corporate/drives');
  return response.data.data;
};
