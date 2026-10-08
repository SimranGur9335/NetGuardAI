import { apiClient } from './api';
import { ThreatCategory } from '../types';

export interface ThreatCategoryInfo {
  category: ThreatCategory;
  description: string;
  behavior: string;
}

export async function getThreatCategories(): Promise<ThreatCategoryInfo[]> {
  return apiClient.get<ThreatCategoryInfo[]>('/threats');
}

export async function getThreatCategory(
  category: ThreatCategory
): Promise<ThreatCategoryInfo> {
  return apiClient.get<ThreatCategoryInfo>(`/threats/${category}`);
}
