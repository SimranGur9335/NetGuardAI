import { CapturedPacket, NormalizedTrafficEvent } from './CaptureTypes';
import { Protocol } from '../../models';

/**
 * PacketNormalizer
 * Converts raw captured packets into normalized traffic events
 * suitable for the detection pipeline.
 */
export class PacketNormalizer {
  normalize(packet: CapturedPacket): NormalizedTrafficEvent {
    return {
      timestamp: packet.timestamp,
      sourceIp: packet.sourceIp,
      destinationIp: packet.destinationIp,
      sourcePort: packet.sourcePort,
      destinationPort: packet.destinationPort,
      protocol: packet.protocol,
      packetSize: packet.packetSize,
      flags: packet.flags,
      interfaceId: packet.interfaceId,
    };
  }

  normalizeBatch(packets: CapturedPacket[]): NormalizedTrafficEvent[] {
    return packets.map((p) => this.normalize(p));
  }
}
