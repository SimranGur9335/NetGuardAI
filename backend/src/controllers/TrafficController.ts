import { Request, Response } from 'express';
import { TrafficService } from '../services/TrafficService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { TrafficQueryParams } from '../models';

export class TrafficController {
  constructor(private trafficService: TrafficService) {}

  async getTraffic(req: Request, res: Response): Promise<void> {
    try {
      const params: TrafficQueryParams = {
        classification: req.query.classification as TrafficQueryParams['classification'],
        protocol: req.query.protocol as TrafficQueryParams['protocol'],
        isSuspicious: req.query.isSuspicious !== undefined
          ? req.query.isSuspicious === 'true'
          : undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const result = await this.trafficService.getTrafficEvents(params);
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 'TRAFFIC_ERROR', 'Failed to retrieve traffic events', 500);
    }
  }

  async getTrafficById(req: Request, res: Response): Promise<void> {
    try {
      const event = await this.trafficService.getTrafficEventById(req.params.id);
      if (!event) {
        sendError(res, 'NOT_FOUND', 'Traffic event not found', 404);
        return;
      }
      sendSuccess(res, event);
    } catch (error) {
      sendError(res, 'TRAFFIC_ERROR', 'Failed to retrieve traffic event', 500);
    }
  }

  async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const activity = await this.trafficService.getTrafficActivity();
      sendSuccess(res, activity);
    } catch (error) {
      sendError(res, 'TRAFFIC_ERROR', 'Failed to retrieve traffic activity', 500);
    }
  }
}
