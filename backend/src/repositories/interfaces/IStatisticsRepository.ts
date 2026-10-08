import { ThreatCategory, Severity } from '../../models';

export interface IStatisticsRepository {
  getThreatDistribution(): Promise<{ category: ThreatCategory; count: number }[]>;
  getSeverityDistribution(): Promise<{ severity: Severity; count: number }[]>;
  getProtocolDistribution(): Promise<{ protocol: string; count: number }[]>;
  getTopSourceIps(limit: number): Promise<{ ip: string; count: number }[]>;
  getTopDestinationIps(limit: number): Promise<{ ip: string; count: number }[]>;
}
