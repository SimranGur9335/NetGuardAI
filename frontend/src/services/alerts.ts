import { apiClient } from './api';
import { Alert, AlertQueryParams, PaginatedResponse } from '../types';

export async function getAlerts(
  params?: AlertQueryParams
): Promise<PaginatedResponse<Alert>> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<Alert>>(
    `/alerts${query ? `?${query}` : ''}`
  );
}

export async function getAlert(id: string): Promise<Alert> {
  return apiClient.get<Alert>(`/alerts/${id}`);
}

export async function acknowledgeAlert(id: string): Promise<Alert> {
  return apiClient.patch<Alert>(`/alerts/${id}/acknowledge`);
}

export async function resolveAlert(id: string): Promise<Alert> {
  return apiClient.patch<Alert>(`/alerts/${id}/resolve`);
}
