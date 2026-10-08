import { Request, Response } from 'express';
import { AlertService } from '../services/AlertService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AlertQueryParams, AlertStatus } from '../models';

export class AlertController {
  constructor(private alertService: AlertService) {}

  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const params: AlertQueryParams = {
        category: req.query.category as AlertQueryParams['category'],
        severity: req.query.severity as AlertQueryParams['severity'],
        status: req.query.status as AlertQueryParams['status'],
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await this.alertService.getAllAlerts(params);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 'ALERT_ERROR', 'Failed to retrieve alerts', 500);
    }
  }

  async getAlertById(req: Request, res: Response): Promise<void> {
    try {
      const alert = await this.alertService.getAlertById(req.params.id);
      if (!alert) {
        sendError(res, 'NOT_FOUND', 'Alert not found', 404);
        return;
      }
      sendSuccess(res, alert);
    } catch (error) {
      sendError(res, 'ALERT_ERROR', 'Failed to retrieve alert', 500);
    }
  }

  async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const alert = await this.alertService.acknowledgeAlert(req.params.id);
      if (!alert) {
        sendError(res, 'NOT_FOUND', 'Alert not found', 404);
        return;
      }
      sendSuccess(res, alert);
    } catch (error) {
      sendError(res, 'ALERT_ERROR', 'Failed to acknowledge alert', 500);
    }
  }

  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const alert = await this.alertService.resolveAlert(req.params.id);
      if (!alert) {
        sendError(res, 'NOT_FOUND', 'Alert not found', 404);
        return;
      }
      sendSuccess(res, alert);
    } catch (error) {
      sendError(res, 'ALERT_ERROR', 'Failed to resolve alert', 500);
    }
  }

  async getAlertCounts(req: Request, res: Response): Promise<void> {
    try {
      const counts = await this.alertService.getAlertCounts();
      sendSuccess(res, counts);
    } catch (error) {
      sendError(res, 'ALERT_ERROR', 'Failed to retrieve alert counts', 500);
    }
  }
}
