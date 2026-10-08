import { apiClient } from './api';
import { AuthUser, LoginResponse } from '../types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', { email, password });
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return apiClient.get<{ user: AuthUser }>('/auth/me');
}

export async function logout(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/logout');
}
