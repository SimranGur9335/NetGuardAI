import { IStatisticsRepository } from '../interfaces/IStatisticsRepository';
import { ThreatCategory, Severity, TrafficEvent, Alert } from '../../models';

export class InMemoryStatisticsRepository implements IStatisticsRepository {
  constructor(
    private trafficEvents: TrafficEvent[],
    private alerts: Alert[]
  ) {}

  async getThreatDistribution(): Promise<{ category: ThreatCategory; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const event of this.trafficEvents) {
      counts[event.classification] = (counts[event.classification] || 0) + 1;
    }
    return Object.entries(counts).map(([category, count]) => ({
      category: category as ThreatCategory,
      count,
    }));
  }

  async getSeverityDistribution(): Promise<{ severity: Severity; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const alert of this.alerts) {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    }
    return Object.entries(counts).map(([severity, count]) => ({
      severity: severity as Severity,
      count,
    }));
  }

  async getProtocolDistribution(): Promise<{ protocol: string; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const event of this.trafficEvents) {
      counts[event.protocol] = (counts[event.protocol] || 0) + 1;
    }
    return Object.entries(counts).map(([protocol, count]) => ({ protocol, count }));
  }

  async getTopSourceIps(limit: number): Promise<{ ip: string; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const event of this.trafficEvents) {
      counts[event.sourceIp] = (counts[event.sourceIp] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getTopDestinationIps(limit: number): Promise<{ ip: string; count: number }[]> {
    const counts: Record<string, number> = {};
    for (const event of this.trafficEvents) {
      counts[event.destinationIp] = (counts[event.destinationIp] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}
