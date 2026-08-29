import { apiClient } from './client';
import { ApiResponse, CreateDonationRequest, Donation, DonationComment, DonationStatus, HealthStatus, PageResponse } from '../types';

export const getHealthStatus = async (): Promise<HealthStatus> => {
  try {
    const response = await apiClient.get<HealthStatus>('/health');
    if (typeof response.data === 'object' && response.data !== null && 'status' in response.data) {
      return response.data;
    }
    return { status: 'DOWN', service: 'DonateConnect Backend', timestamp: new Date().toISOString() };
  } catch {
    return { status: 'DOWN', service: 'DonateConnect Backend', timestamp: new Date().toISOString() };
  }
};

// Donor APIs
export const createDonation = async (dto: CreateDonationRequest): Promise<Donation> => {
  const response = await apiClient.post<ApiResponse<Donation>>('/donations', dto);
  return response.data.data;
};

export const getMyDonations = async (page = 0, size = 10): Promise<PageResponse<Donation>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Donation>>>(`/donations/mine?page=${page}&size=${size}`);
  return response.data.data;
};

export const getDonationById = async (id: string): Promise<Donation> => {
  const response = await apiClient.get<ApiResponse<Donation>>(`/donations/mine/${id}`);
  return response.data.data;
};

/**
 * Upload a single donation photo file to the local storage backend.
 * Returns the relative URL path (e.g. "/api/donations/photo/uuid.jpg") to store in photoUrls.
 */
export const uploadDonationPhoto = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<{ url: string }>>('/donations/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.url;
};

// NGO Role APIs
export const getNgoAssignedDonations = async (page = 0, size = 100): Promise<PageResponse<Donation>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<Donation>>>(`/ngo/donations?page=${page}&size=${size}`);
  return response.data.data;
};

export const updateDonationStatusByNgo = async (id: string, status: DonationStatus): Promise<Donation> => {
  const response = await apiClient.patch<ApiResponse<Donation>>(`/ngo/donations/${id}/status`, { status });
  return response.data.data;
};

// Donation Comments (Direct Messaging)
export const getDonationComments = async (donationId: string, page = 0, size = 100): Promise<PageResponse<DonationComment>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<DonationComment>>>(`/donations/${donationId}/comments?page=${page}&size=${size}`);
  return response.data.data;
};

export const addDonationComment = async (donationId: string, message: string): Promise<DonationComment> => {
  const response = await apiClient.post<ApiResponse<DonationComment>>(`/donations/${donationId}/comments`, { message });
  return response.data.data;
};

// Admin Role APIs
export const getAdminDonations = async (
  category?: string,
  status?: string,
  ngoId?: string,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<Donation>> => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (status) params.append('status', status);
  if (ngoId) params.append('ngoId', ngoId);
  params.append('page', page.toString());
  params.append('size', size.toString());

  const response = await apiClient.get<ApiResponse<PageResponse<Donation>>>(`/admin/donations?${params.toString()}`);
  return response.data.data;
};
