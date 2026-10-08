import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.dashboardService.getSummary();
      sendSuccess(res, summary);
    } catch (error) {
      sendError(res, 'DASHBOARD_ERROR', 'Failed to retrieve dashboard summary', 500);
    }
  }
}
