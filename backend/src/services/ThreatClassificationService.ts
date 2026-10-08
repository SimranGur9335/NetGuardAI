import { ThreatCategory, Severity, Protocol } from '../models';

export interface ClassificationResult {
  category: ThreatCategory;
  severity: Severity;
  description: string;
}

/**
 * ThreatClassificationService
 * Classifies detected threats into categories and assigns severity.
 * For development, uses rule-based classification.
 * Later will be replaced by trained ML classifiers.
 */
export class ThreatClassificationService {
  classify(
    category: ThreatCategory,
    protocol: Protocol,
    packetSize: number,
    flags: string[]
  ): ClassificationResult {
    switch (category) {
      case ThreatCategory.DOS_DDOS:
        return {
          category,
          severity: Severity.CRITICAL,
          description: `Potential DoS/DDoS attack detected. High volume of ${protocol} traffic with abnormal packet patterns.`,
        };

      case ThreatCategory.BRUTE_FORCE:
        return {
          category,
          severity: Severity.HIGH,
          description: `Brute force authentication attempt detected on ${protocol} service. Multiple failed authentication patterns observed.`,
        };

      case ThreatCategory.PORT_SCAN:
        return {
          category,
          severity: Severity.MEDIUM,
          description: `Port scanning activity detected. Multiple destination ports probed in short time window.`,
        };

      case ThreatCategory.NORMAL:
      default:
        return {
          category: ThreatCategory.NORMAL,
          severity: Severity.LOW,
          description: 'Normal traffic pattern.',
        };
    }
  }

  getCategoryDescription(category: ThreatCategory): string {
    const descriptions: Record<ThreatCategory, string> = {
      [ThreatCategory.NORMAL]: 'Normal network traffic with no suspicious patterns detected.',
      [ThreatCategory.DOS_DDOS]: 'Denial of Service or Distributed Denial of Service attack. Attempts to overwhelm a target system with excessive traffic.',
      [ThreatCategory.BRUTE_FORCE]: 'Brute force attack. Repeated authentication attempts to gain unauthorized access to a system or service.',
      [ThreatCategory.PORT_SCAN]: 'Port scanning activity. Systematic probing of multiple ports to identify open services and potential vulnerabilities.',
    };
    return descriptions[category];
  }

  getCategoryBehavior(category: ThreatCategory): string {
    const behaviors: Record<ThreatCategory, string> = {
      [ThreatCategory.NORMAL]: 'Regular user activity, standard protocol behavior, expected traffic patterns.',
      [ThreatCategory.DOS_DDOS]: 'High request rate, SYN flood patterns, UDP amplification, abnormal packet sizes, distributed source IPs.',
      [ThreatCategory.BRUTE_FORCE]: 'Repeated authentication failures, multiple login attempts from single source, targeting SSH/FTP/HTTP auth endpoints.',
      [ThreatCategory.PORT_SCAN]: 'Sequential port probing, SYN scans, FIN scans, multiple destination ports from single source in short timeframe.',
    };
    return behaviors[category];
  }
}
