import { apiClient } from './client';
import { ApiResponse, CreateNgoRequest, CreateRatingRequest, CreateUrgentNeedRequest, ImpactMetrics, NGOProfile, NgoRating, NgoUrgentNeed, PageResponse, UpdateNgoProfileDto } from '../types';

// Public / Donor APIs
export const getVerifiedNgos = async (): Promise<NGOProfile[]> => {
  const response = await apiClient.get<ApiResponse<NGOProfile[]>>('/ngo');
  return response.data.data;
};

export const getNgoById = async (id: string): Promise<NGOProfile> => {
  const response = await apiClient.get<ApiResponse<NGOProfile>>(`/ngo/${id}`);
  return response.data.data;
};

// Impact & Urgent Needs APIs
export const getImpactMetrics = async (): Promise<ImpactMetrics> => {
  const response = await apiClient.get<ApiResponse<ImpactMetrics>>('/impact');
  return response.data.data;
};

export const getActiveUrgentNeeds = async (): Promise<NgoUrgentNeed[]> => {
  const response = await apiClient.get<ApiResponse<NgoUrgentNeed[]>>('/urgent-needs');
  return response.data.data;
};

export const getNgoRatings = async (ngoId: string): Promise<NgoRating[]> => {
  const response = await apiClient.get<ApiResponse<PageResponse<NgoRating>>>(`/ngo/${ngoId}/ratings?page=0&size=100`);
  return response.data.data.content;
};

export const addNgoRating = async (ngoId: string, dto: CreateRatingRequest): Promise<NgoRating> => {
  const response = await apiClient.post<ApiResponse<NgoRating>>(`/ngo/${ngoId}/ratings`, dto);
  return response.data.data;
};

// NGO Role APIs
export const getOwnNgoProfile = async (): Promise<NGOProfile> => {
  const response = await apiClient.get<ApiResponse<NGOProfile>>('/ngo/me/profile');
  return response.data.data;
};

export const updateOwnNgoProfile = async (dto: UpdateNgoProfileDto): Promise<NGOProfile> => {
  const response = await apiClient.patch<ApiResponse<NGOProfile>>('/ngo/me/profile', dto);
  return response.data.data;
};

export const createUrgentNeed = async (dto: CreateUrgentNeedRequest): Promise<NgoUrgentNeed> => {
  const response = await apiClient.post<ApiResponse<NgoUrgentNeed>>('/ngo/urgent-needs', dto);
  return response.data.data;
};

export const getOwnUrgentNeeds = async (): Promise<NgoUrgentNeed[]> => {
  const response = await apiClient.get<ApiResponse<NgoUrgentNeed[]>>('/ngo/urgent-needs');
  return response.data.data;
};

export const toggleUrgentNeed = async (id: string): Promise<NgoUrgentNeed> => {
  const response = await apiClient.patch<ApiResponse<NgoUrgentNeed>>(`/ngo/urgent-needs/${id}/toggle`);
  return response.data.data;
};

// Admin Role APIs
export const getAllNgosAdmin = async (): Promise<NGOProfile[]> => {
  const response = await apiClient.get<ApiResponse<NGOProfile[]>>('/admin/ngo');
  return response.data.data;
};

export const createNgoByAdmin = async (dto: CreateNgoRequest): Promise<NGOProfile> => {
  const response = await apiClient.post<ApiResponse<NGOProfile>>('/admin/ngo', dto);
  return response.data.data;
};

export const verifyNgoByAdmin = async (id: string, verified: boolean): Promise<NGOProfile> => {
  const response = await apiClient.patch<ApiResponse<NGOProfile>>(`/admin/ngo/${id}/verify?verified=${verified}`);
  return response.data.data;
};

export const deleteNgoByAdmin = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/ngo/${id}`);
};
