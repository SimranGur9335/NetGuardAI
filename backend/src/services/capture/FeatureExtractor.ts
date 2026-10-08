import { NormalizedTrafficEvent } from './CaptureTypes';
import { TrafficEvent, ThreatCategory } from '../../models';

/**
 * FeatureExtractor
 * Extracts detection features from normalized traffic events.
 * These features are used by the detection engine.
 */
export interface TrafficFeatures {
  packetSize: number;
  protocol: string;
  flags: string[];
  sourceIp: string;
  destinationIp: string;
  sourcePort: number | null;
  destinationPort: number | null;
  synCount: number;
  ackCount: number;
  isSynOnly: boolean;
  isSynAck: boolean;
  isAuthRelated: boolean;
}

export class FeatureExtractor {
  extract(event: NormalizedTrafficEvent): TrafficFeatures {
    const flags = event.flags || [];
    const synCount = flags.filter((f) => f === 'SYN').length;
    const ackCount = flags.filter((f) => f === 'ACK').length;
    const isSynOnly = flags.includes('SYN') && !flags.includes('ACK');
    const isSynAck = flags.includes('SYN') && flags.includes('ACK');
    const isAuthRelated =
      (event.protocol === 'SSH' && flags.some((f) => f.includes('AUTH'))) ||
      (event.destinationPort === 22 && flags.includes('SYN'));

    return {
      packetSize: event.packetSize,
      protocol: event.protocol,
      flags,
      sourceIp: event.sourceIp,
      destinationIp: event.destinationIp,
      sourcePort: event.sourcePort,
      destinationPort: event.destinationPort,
      synCount,
      ackCount,
      isSynOnly,
      isSynAck,
      isAuthRelated,
    };
  }

  /**
   * Build a TrafficEvent input for the detection pipeline from normalized
   * input plus its extracted features.
   */
  toTrafficEvent(
    normalized: NormalizedTrafficEvent,
    features?: TrafficFeatures
  ): Omit<TrafficEvent, 'id' | 'timestamp' | 'classification' | 'isSuspicious'> {
    const f = features ?? this.extract(normalized);
    return {
      sourceIp: f.sourceIp,
      destinationIp: f.destinationIp,
      sourcePort: f.sourcePort || 0,
      destinationPort: f.destinationPort || 0,
      protocol: normalized.protocol,
      packetSize: f.packetSize,
      flags: f.flags,
    };
  }
}
