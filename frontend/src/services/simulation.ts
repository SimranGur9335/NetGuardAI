import { apiClient } from './api';

export interface SimulationStatus {
  running: boolean;
  mode: string;
  interval: number;
  startedAt: string | null;
  message?: string;
}

export async function startSimulation(): Promise<SimulationStatus> {
  return apiClient.post<SimulationStatus>('/simulation/start');
}

export async function stopSimulation(): Promise<SimulationStatus> {
  return apiClient.post<SimulationStatus>('/simulation/stop');
}

export async function getSimulationStatus(): Promise<SimulationStatus> {
  return apiClient.get<SimulationStatus>('/simulation/status');
}
