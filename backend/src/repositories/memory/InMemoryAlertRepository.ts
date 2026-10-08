import { IAlertRepository } from '../interfaces/IAlertRepository';
import { Alert, AlertQueryParams, AlertStatus, PaginatedResponse } from '../../models';

export class InMemoryAlertRepository implements IAlertRepository {
  private alerts: Alert[] = [];

  async findAll(params?: AlertQueryParams): Promise<PaginatedResponse<Alert>> {
    let filtered = [...this.alerts];

    if (params?.category) {
      filtered = filtered.filter((a) => a.category === params.category);
    }
    if (params?.severity) {
      filtered = filtered.filter((a) => a.severity === params.severity);
    }
    if (params?.status) {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.sourceIp.includes(search) ||
          a.destinationIp.includes(search) ||
          a.description.toLowerCase().includes(search) ||
          a.id.toLowerCase().includes(search)
      );
    }

    const sortBy = params?.sortBy || 'timestamp';
    const sortOrder = params?.sortOrder || 'desc';
    filtered.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy];
      const bVal = (b as unknown as Record<string, unknown>)[sortBy];
      if (aVal == null || bVal == null) return 0;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit);

    return {
      items,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }

  async findById(id: string): Promise<Alert | null> {
    return this.alerts.find((a) => a.id === id) || null;
  }

  async save(alert: Alert): Promise<Alert> {
    this.alerts.push(alert);
    return alert;
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert | null> {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    alert.status = status;
    return alert;
  }

  async count(): Promise<number> {
    return this.alerts.length;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const alert of this.alerts) {
      counts[alert.status] = (counts[alert.status] || 0) + 1;
    }
    return counts;
  }

  async countBySeverity(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const alert of this.alerts) {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    }
    return counts;
  }

  async countByCategory(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const alert of this.alerts) {
      counts[alert.category] = (counts[alert.category] || 0) + 1;
    }
    return counts;
  }

  async findRecent(limit: number): Promise<Alert[]> {
    return [...this.alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async clear(): Promise<void> {
    this.alerts = [];
  }

  getAll(): Alert[] {
    return [...this.alerts];
  }
}
