import { apiClient } from './api';
import { NetworkInterface, CaptureStatus } from '../types';

export async function getInterfaces(): Promise<NetworkInterface[]> {
  return apiClient.get<NetworkInterface[]>('/monitoring/interfaces');
}

export async function getCaptureStatus(): Promise<CaptureStatus> {
  return apiClient.get<CaptureStatus>('/monitoring/status');
}

export async function startMonitoring(interfaceId: string): Promise<CaptureStatus> {
  return apiClient.post<CaptureStatus>('/monitoring/start', { interfaceId });
}

export async function stopMonitoring(): Promise<CaptureStatus> {
  return apiClient.post<CaptureStatus>('/monitoring/stop');
}
