import { Protocol } from '../../models';

export interface NetworkInterface {
  id: string;
  name: string;
  description: string;
  ipv4: string | null;
  ipv6: string | null;
  mac: string | null;
  status: 'up' | 'down';
}

export interface CapturedPacket {
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number | null;
  destinationPort: number | null;
  protocol: Protocol;
  packetSize: number;
  flags: string[];
  interfaceId: string;
  rawData?: string;
}

export interface CaptureStatus {
  running: boolean;
  interfaceId: string | null;
  interfaceName: string | null;
  packetsCaptured: number;
  startedAt: string | null;
  captureMethod: string;
  available: boolean;
  reason: string | null;
}

export interface NormalizedTrafficEvent {
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number | null;
  destinationPort: number | null;
  protocol: Protocol;
  packetSize: number;
  flags: string[];
  interfaceId: string;
}
