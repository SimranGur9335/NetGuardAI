import { DashboardSummary, MonitoringMode, SystemComponent, ThreatDistribution, SeverityDistribution } from '../models';
import { ITrafficRepository } from '../repositories/interfaces/ITrafficRepository';
import { IAlertRepository } from '../repositories/interfaces/IAlertRepository';
import { PacketCaptureService } from './capture/PacketCaptureService';
import { logger } from '../utils/logger';

export class DashboardService {
  constructor(
    private trafficRepository: ITrafficRepository,
    private alertRepository: IAlertRepository,
    private captureService: PacketCaptureService
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const [trafficCounts, alertCounts, recentEvents, captureStatus] = await Promise.all([
      this.trafficRepository.countByClassification(),
      this.alertRepository.countByStatus(),
      this.trafficRepository.findRecent(10),
      this.captureService.getStatus(),
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

    const systemHealth = this.getSystemHealth(captureStatus.available, captureStatus.running);

    return {
      totalEvents,
      suspiciousEvents,
      normalEvents,
      activeAlerts,
      resolvedAlerts,
      threatDistribution,
      severityDistribution,
      recentEvents,
      monitoringMode: captureStatus.running ? MonitoringMode.LIVE : MonitoringMode.OFFLINE,
      systemHealth,
    };
  }

  private getSystemHealth(captureAvailable: boolean, captureRunning: boolean): SystemComponent[] {
    return [
      {
        name: 'Backend API',
        status: 'Operational',
        details: 'API responding normally',
      },
      {
        name: 'Packet Capture',
        status: captureAvailable ? (captureRunning ? 'Active' : 'Ready') : 'Unavailable',
        details: captureAvailable
          ? captureRunning
            ? `Capturing on ${captureRunning ? 'interface' : ''}`
            : 'Ready to capture'
          : 'Npcap not installed',
      },
      {
        name: 'Detection Engine',
        status: 'Operational',
        details: 'Rule-based detection active',
      },
      {
        name: 'Threat Classifier',
        status: 'Operational',
        details: 'Classification pipeline active',
      },
      {
        name: 'Alert Engine',
        status: 'Operational',
        details: 'Alert generation active',
      },
      {
        name: 'Authentication',
        status: 'Operational',
        details: 'JWT authentication active',
      },
      {
        name: 'Database',
        status: 'Not Configured',
        details: 'In-memory storage only',
      },
    ];
  }
}
