import { apiClient } from './api';
import { SystemComponent } from '../types';

export interface SystemCaptureStatus {
  available: boolean;
  running: boolean;
  reason: string | null;
  method: string;
  interfaceName: string | null;
  packetsCaptured: number;
}

export interface SystemStatus {
  components: SystemComponent[];
  monitoringMode: string;
  capture?: SystemCaptureStatus;
  timestamp: string;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return apiClient.get<SystemStatus>('/system/status');
}

export async function getHealth(): Promise<{
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}> {
  return apiClient.get('/system/health');
}
