import { Alert, AlertStatus, ThreatCategory, Severity, Protocol } from '../models';
import { IAlertRepository } from '../repositories/interfaces/IAlertRepository';
import { generateAlertId } from '../utils/idGenerator';
import { logger } from '../utils/logger';

export class AlertService {
  /** Suppress duplicate alerts for the same category/source/destination within this window. */
  private static readonly ALERT_COOLDOWN_MS = 120_000;
  private recentAlerts = new Map<string, number>();

  constructor(private alertRepository: IAlertRepository) {}

  /**
   * Create an alert, unless an identical alert (category + endpoints) was
   * already raised within the cooldown window — returns null when suppressed.
   */
  async createAlert(params: {
    category: ThreatCategory;
    severity: Severity;
    sourceIp: string;
    destinationIp: string;
    protocol: Protocol;
    description: string;
    prediction?: string;
    detectionSource: string;
  }): Promise<Alert | null> {
    const now = Date.now();
    const key = `${params.category}:${params.sourceIp}:${params.destinationIp}:${params.protocol}`;
    const last = this.recentAlerts.get(key);
    if (last !== undefined && now - last < AlertService.ALERT_COOLDOWN_MS) {
      return null;
    }
    this.recentAlerts.set(key, now);
    this.pruneRecentAlerts(now);

    const alert: Alert = {
      id: generateAlertId(),
      timestamp: new Date().toISOString(),
      category: params.category,
      severity: params.severity,
      sourceIp: params.sourceIp,
      destinationIp: params.destinationIp,
      protocol: params.protocol,
      status: AlertStatus.NEW,
      description: params.description,
      prediction: params.prediction,
      detectionSource: params.detectionSource,
    };

    const saved = await this.alertRepository.save(alert);
    logger.info('Alert created', { alertId: saved.id, category: saved.category, severity: saved.severity });
    return saved;
  }

  async getAllAlerts(params?: Parameters<IAlertRepository['findAll']>[0]) {
    return this.alertRepository.findAll(params);
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.alertRepository.findById(id);
  }

  async acknowledgeAlert(id: string): Promise<Alert | null> {
    const alert = await this.alertRepository.updateStatus(id, AlertStatus.ACKNOWLEDGED);
    if (alert) {
      logger.info('Alert acknowledged', { alertId: id });
    }
    return alert;
  }

  async resolveAlert(id: string): Promise<Alert | null> {
    const alert = await this.alertRepository.updateStatus(id, AlertStatus.RESOLVED);
    if (alert) {
      logger.info('Alert resolved', { alertId: id });
    }
    return alert;
  }

  async getAlertCounts(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const [total, byStatus, bySeverity, byCategory] = await Promise.all([
      this.alertRepository.count(),
      this.alertRepository.countByStatus(),
      this.alertRepository.countBySeverity(),
      this.alertRepository.countByCategory(),
    ]);

    return { total, byStatus, bySeverity, byCategory };
  }

  async getRecentAlerts(limit: number): Promise<Alert[]> {
    return this.alertRepository.findRecent(limit);
  }

  /** Keep the cooldown map bounded. */
  private pruneRecentAlerts(now: number): void {
    for (const [key, t] of this.recentAlerts) {
      if (now - t >= AlertService.ALERT_COOLDOWN_MS) {
        this.recentAlerts.delete(key);
      }
    }
  }
}
