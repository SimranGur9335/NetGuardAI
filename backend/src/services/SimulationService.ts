import { Protocol } from '../models';
import { TrafficService } from './TrafficService';
import { logger } from '../utils/logger';

export interface RawTrafficInput {
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: Protocol;
  packetSize: number;
  flags: string[];
}

/**
 * SimulationService
 * Generates raw traffic inputs for the development simulation.
 * These inputs are processed through the full detection pipeline
 * (DetectionService → ThreatClassificationService → AlertService).
 *
 * This is NOT real network traffic — it is clearly labeled simulation data.
 * Later, this will be replaced by real packet capture (Wireshark/Scapy).
 */
export class SimulationService {
  private sourceIps = [
    '192.168.1.100', '192.168.1.101', '192.168.1.102',
    '10.0.0.50', '10.0.0.51', '10.0.0.52',
    '172.16.0.10', '172.16.0.11',
  ];

  private destinationIps = [
    '192.168.1.1', '192.168.1.254',
    '10.0.0.1', '10.0.0.2',
    '172.16.0.1',
  ];

  constructor(private trafficService: TrafficService) {}

  /** Generate a single normal traffic input */
  async generateNormalTraffic(): Promise<void> {
    const input: RawTrafficInput = {
      sourceIp: this.randomSourceIp(),
      destinationIp: this.randomDestinationIp(),
      sourcePort: this.randomPort(1024, 65535),
      destinationPort: this.randomDestinationPort(),
      protocol: this.randomNormalProtocol(),
      packetSize: this.randomPacketSize(64, 1500),
      flags: this.randomNormalFlags(),
    };

    await this.trafficService.processTrafficEvent(input);
  }

  /** Generate a DoS/DDoS traffic input */
  async generateDosDdosEvent(): Promise<void> {
    const input: RawTrafficInput = {
      sourceIp: this.randomSourceIp(),
      destinationIp: this.randomDestinationIp(),
      sourcePort: this.randomPort(1024, 65535),
      destinationPort: 80,
      protocol: Protocol.HTTP,
      packetSize: this.randomPacketSize(1400, 1500),
      flags: ['SYN', 'SYN-ACK', 'PSH'],
    };

    await this.trafficService.processTrafficEvent(input);
  }

  /** Generate a brute force traffic input */
  async generateBruteForceEvent(): Promise<void> {
    const input: RawTrafficInput = {
      sourceIp: this.randomSourceIp(),
      destinationIp: this.randomDestinationIp(),
      sourcePort: this.randomPort(1024, 65535),
      destinationPort: 22,
      protocol: Protocol.SSH,
      packetSize: this.randomPacketSize(64, 256),
      flags: ['SYN', 'AUTH', 'AUTH-FAIL'],
    };

    await this.trafficService.processTrafficEvent(input);
  }

  /** Generate a port scan traffic input */
  async generatePortScanEvent(): Promise<void> {
    const input: RawTrafficInput = {
      sourceIp: this.randomSourceIp(),
      destinationIp: this.randomDestinationIp(),
      sourcePort: this.randomPort(1024, 65535),
      destinationPort: this.randomPort(1, 1024),
      protocol: Protocol.TCP,
      packetSize: this.randomPacketSize(40, 64),
      flags: ['SYN'],
    };

    await this.trafficService.processTrafficEvent(input);
  }

  /**
   * Generate a mixed batch of events.
   * Mostly normal traffic with occasional suspicious events.
   */
  async generateMixedBatch(): Promise<void> {
    // Generate 3-6 normal events
    const normalCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < normalCount; i++) {
      await this.generateNormalTraffic();
    }

    // Occasionally generate a suspicious event (30% chance)
    if (Math.random() < 0.3) {
      const suspiciousType = Math.random();
      if (suspiciousType < 0.33) {
        await this.generateDosDdosEvent();
      } else if (suspiciousType < 0.66) {
        await this.generateBruteForceEvent();
      } else {
        await this.generatePortScanEvent();
      }
    }
  }

  private randomSourceIp(): string {
    return this.sourceIps[Math.floor(Math.random() * this.sourceIps.length)];
  }

  private randomDestinationIp(): string {
    return this.destinationIps[Math.floor(Math.random() * this.destinationIps.length)];
  }

  private randomPort(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomDestinationPort(): number {
    const commonPorts = [80, 443, 22, 53, 25, 8080, 8443];
    return commonPorts[Math.floor(Math.random() * commonPorts.length)];
  }

  private randomNormalProtocol(): Protocol {
    const protocols = [Protocol.HTTP, Protocol.HTTPS, Protocol.DNS, Protocol.TCP];
    return protocols[Math.floor(Math.random() * protocols.length)];
  }

  private randomPacketSize(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomNormalFlags(): string[] {
    const flagSets = [
      ['SYN', 'ACK'],
      ['ACK', 'PSH'],
      ['ACK', 'FIN'],
      ['ACK'],
    ];
    return flagSets[Math.floor(Math.random() * flagSets.length)];
  }
}
