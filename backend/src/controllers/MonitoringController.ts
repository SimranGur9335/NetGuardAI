import { Request, Response } from 'express';
import { PacketCaptureService } from '../services/capture/PacketCaptureService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class MonitoringController {
  constructor(private captureService: PacketCaptureService) {}

  async getInterfaces(req: Request, res: Response): Promise<void> {
    try {
      const interfaces = await this.captureService.getInterfaces();
      sendSuccess(res, interfaces);
    } catch (error) {
      sendError(res, 'INTERFACE_ERROR', 'Failed to retrieve network interfaces', 500);
    }
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.captureService.getStatus();
      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 'CAPTURE_ERROR', 'Failed to get capture status', 500);
    }
  }

  async start(req: Request, res: Response): Promise<void> {
    try {
      const { interfaceId } = req.body;
      if (!interfaceId) {
        sendError(res, 'VALIDATION_ERROR', 'interfaceId is required', 400);
        return;
      }

      await this.captureService.start(interfaceId);
      const status = await this.captureService.getStatus();
      sendSuccess(res, status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start capture';
      sendError(res, 'CAPTURE_ERROR', message, 400);
    }
  }

  async stop(req: Request, res: Response): Promise<void> {
    try {
      await this.captureService.stop();
      const status = await this.captureService.getStatus();
      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 'CAPTURE_ERROR', 'Failed to stop capture', 500);
    }
  }
}
