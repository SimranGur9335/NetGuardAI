import { apiClient } from './api';
import { DashboardSummary, TrafficActivityPoint } from '../types';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiClient.get<DashboardSummary>('/dashboard/summary');
}

export async function getTrafficActivity(): Promise<TrafficActivityPoint[]> {
  return apiClient.get<TrafficActivityPoint[]>('/traffic/activity');
}
