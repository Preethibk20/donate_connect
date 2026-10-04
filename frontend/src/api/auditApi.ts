import { apiClient } from './client';
import { ApiResponse, AuditLog, PageResponse } from '../types';

export const getAuditLogs = async (
  page: number = 0,
  size: number = 50,
  action?: string,
  entityType?: string
): Promise<PageResponse<AuditLog>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (action) params.append('action', action);
  if (entityType) params.append('entityType', entityType);

  const response = await apiClient.get<ApiResponse<PageResponse<AuditLog>>>(`/admin/audit?${params.toString()}`);
  return response.data.data;
};
