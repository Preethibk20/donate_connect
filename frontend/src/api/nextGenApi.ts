import { apiClient } from './client';
import { ApiResponse, BlockchainBlock, NgoResourceTrade, SmartLocker, SosStatus } from '../types';

export const getSmartLockers = async (): Promise<SmartLocker[]> => {
  const response = await apiClient.get<ApiResponse<SmartLocker[]>>('/lockers');
  return response.data.data;
};

export const getBlockchainLedger = async (): Promise<BlockchainBlock[]> => {
  const response = await apiClient.get<ApiResponse<BlockchainBlock[]>>('/blockchain');
  return response.data.data;
};

export const getActiveResourceTrades = async (): Promise<NgoResourceTrade[]> => {
  const response = await apiClient.get<ApiResponse<NgoResourceTrade[]>>('/trades');
  return response.data.data;
};

export const getSosStatus = async (): Promise<SosStatus> => {
  const response = await apiClient.get<ApiResponse<SosStatus>>('/sos');
  return response.data.data;
};
