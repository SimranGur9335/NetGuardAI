import { apiClient } from './api';
import { ModelInfo, EvaluationResult } from '../types';

export async function getModels(): Promise<ModelInfo[]> {
  return apiClient.get<ModelInfo[]>('/models');
}

export async function getModel(id: string): Promise<ModelInfo> {
  return apiClient.get<ModelInfo>(`/models/${id}`);
}

export async function getEvaluationStatus(): Promise<{
  overallStatus: string;
  message: string;
  evaluations: EvaluationResult[];
}> {
  return apiClient.get('/models/evaluation');
}

export async function getModelEvaluation(id: string): Promise<EvaluationResult> {
  return apiClient.get<EvaluationResult>(`/models/${id}/evaluation`);
}
