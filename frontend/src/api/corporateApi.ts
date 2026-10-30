import { apiClient } from './client';
import { ApiResponse, CorporateDrive } from '../types';

export const getCorporateDrives = async (): Promise<CorporateDrive[]> => {
  const response = await apiClient.get<any>('/corporate/drives');
  const payload = response.data?.data;
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }
  return [];
};

export const createCorporateDrive = async (dto: any): Promise<CorporateDrive> => {
  const response = await apiClient.post<any>('/corporate/drives', dto);
  const data = response.data?.data;
  return data;
};
