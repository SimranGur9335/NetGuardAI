import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { config } from '../config';

export class SystemController {
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
      const status = {
        components: [
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
        ],
        monitoringMode: 'SIMULATION',
        timestamp: new Date().toISOString(),
      };
      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 'SYSTEM_ERROR', 'Failed to retrieve system status', 500);
    }
  }
}
