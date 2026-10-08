import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { config } from '../config';
import { PacketCaptureService } from '../services/capture/PacketCaptureService';
import { MonitoringMode } from '../models';

export class SystemController {
  constructor(private captureService: PacketCaptureService) {}

  async getHealth(req: Request, res: Response): Promise<void> {
    sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    });
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const capture = await this.captureService.getStatus();

      const captureStatus = !capture.available
        ? 'Unavailable'
        : capture.running
          ? 'Active'
          : 'Ready';
      const captureDetails = !capture.available
        ? capture.reason || 'Npcap or another supported capture mechanism is not installed.'
        : capture.running
          ? `Capturing real packets on "${capture.interfaceName}" via ${capture.captureMethod} (${capture.packetsCaptured} packets this session)`
          : `Ready — ${capture.captureMethod} detected. Start monitoring to capture real packets.`;

      const status = {
        components: [
          {
            name: 'Backend API',
            status: 'Operational',
            details: 'API responding normally',
          },
          {
            name: 'Packet Capture',
            status: captureStatus,
            details: captureDetails,
          },
          {
            name: 'Detection Engine',
            status: 'Operational',
            details: 'Development Detection Engine — rule-based flow analysis (not a trained ML model)',
          },
          {
            name: 'Threat Classifier',
            status: 'Operational',
            details: 'Rule-based classification active',
          },
          {
            name: 'Alert Engine',
            status: 'Operational',
            details: 'Alert generation and management active (real captured traffic only)',
          },
          {
            name: 'Storage',
            status: 'Not Configured',
            details: 'In-memory repositories only — no database configured',
          },
          {
            name: 'Authentication',
            status: 'Operational',
            details: 'JWT authentication active',
          },
        ],
        monitoringMode: capture.running ? MonitoringMode.LIVE : MonitoringMode.OFFLINE,
        capture: {
          available: capture.available,
          running: capture.running,
          reason: capture.reason,
          method: capture.captureMethod,
          interfaceName: capture.interfaceName,
          packetsCaptured: capture.packetsCaptured,
        },
        timestamp: new Date().toISOString(),
      };
      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 'SYSTEM_ERROR', 'Failed to retrieve system status', 500);
    }
  }
}
