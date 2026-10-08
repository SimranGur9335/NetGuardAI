import { Alert, AlertQueryParams, AlertStatus, PaginatedResponse } from '../../models';

export interface IAlertRepository {
  findAll(params?: AlertQueryParams): Promise<PaginatedResponse<Alert>>;
  findById(id: string): Promise<Alert | null>;
  save(alert: Alert): Promise<Alert>;
  updateStatus(id: string, status: AlertStatus): Promise<Alert | null>;
  count(): Promise<number>;
  countByStatus(): Promise<Record<string, number>>;
  countBySeverity(): Promise<Record<string, number>>;
  countByCategory(): Promise<Record<string, number>>;
  findRecent(limit: number): Promise<Alert[]>;
  clear(): Promise<void>;
}
