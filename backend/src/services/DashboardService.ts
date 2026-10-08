import { DashboardSummary, MonitoringMode, SystemComponent, ThreatDistribution, SeverityDistribution } from '../models';
import { ITrafficRepository } from '../repositories/interfaces/ITrafficRepository';
import { IAlertRepository } from '../repositories/interfaces/IAlertRepository';
import { logger } from '../utils/logger';

export class DashboardService {
  constructor(
    private trafficRepository: ITrafficRepository,
    private alertRepository: IAlertRepository
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const [trafficCounts, alertCounts, recentEvents, recentAlerts] = await Promise.all([
      this.trafficRepository.countByClassification(),
      this.alertRepository.countByStatus(),
      this.trafficRepository.findRecent(10),
      this.alertRepository.findRecent(5),
    ]);

    const totalEvents = Object.values(trafficCounts).reduce((a, b) => a + b, 0);
    const suspiciousEvents = totalEvents - (trafficCounts['NORMAL'] || 0);
    const normalEvents = trafficCounts['NORMAL'] || 0;

    const activeAlerts = (alertCounts['NEW'] || 0) + (alertCounts['ACKNOWLEDGED'] || 0);
    const resolvedAlerts = alertCounts['RESOLVED'] || 0;

    // Build threat distribution
    const threatDistribution: ThreatDistribution[] = Object.entries(trafficCounts).map(([category, count]) => ({
      category: category as ThreatDistribution['category'],
      count,
    }));

    // Build severity distribution from alerts
    const severityCounts = await this.alertRepository.countBySeverity();
    const severityDistribution: SeverityDistribution[] = Object.entries(severityCounts).map(([severity, count]) => ({
      severity: severity as SeverityDistribution['severity'],
      count,
    }));

    const systemHealth = this.getSystemHealth();

    return {
      totalEvents,
      suspiciousEvents,
      normalEvents,
      activeAlerts,
      resolvedAlerts,
      threatDistribution,
      severityDistribution,
      recentEvents,
      monitoringMode: MonitoringMode.SIMULATION,
      systemHealth,
    };
  }

  private getSystemHealth(): SystemComponent[] {
    return [
      {
        name: 'Backend API',
        status: 'Operational',
        details: 'API responding normally',
      },
      {
        name: 'Traffic Monitor',
        status: 'Simulation',
        details: 'Development simulation mode - no live packet capture',
      },
      {
        name: 'Detection Engine',
        status: 'Ready',
        details: 'Development detection model active',
      },
      {
        name: 'Threat Classifier',
        status: 'Ready',
        details: 'Rule-based classification active',
      },
      {
        name: 'Alert Engine',
        status: 'Operational',
        details: 'Alert generation and management active',
      },
      {
        name: 'Database',
        status: 'Not Configured',
        details: 'In-memory storage - database integration pending',
      },
    ];
  }
}
