import { apiClient } from './api';
import { TrafficEvent, TrafficQueryParams, PaginatedResponse } from '../types';

export async function getTrafficEvents(
  params?: TrafficQueryParams
): Promise<PaginatedResponse<TrafficEvent>> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString();
  return apiClient.get<PaginatedResponse<TrafficEvent>>(
    `/traffic${query ? `?${query}` : ''}`
  );
}

export async function getTrafficEvent(id: string): Promise<TrafficEvent> {
  return apiClient.get<TrafficEvent>(`/traffic/${id}`);
}
