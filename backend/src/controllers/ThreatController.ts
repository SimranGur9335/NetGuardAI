import { Request, Response } from 'express';
import { ThreatClassificationService } from '../services/ThreatClassificationService';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { ThreatCategory } from '../models';

export class ThreatController {
  constructor(private classificationService: ThreatClassificationService) {}

  async getThreatCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = Object.values(ThreatCategory).filter((c) => c !== ThreatCategory.NORMAL);
      const result = categories.map((category) => ({
        category,
        description: this.classificationService.getCategoryDescription(category),
        behavior: this.classificationService.getCategoryBehavior(category),
      }));
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 'THREAT_ERROR', 'Failed to retrieve threat categories', 500);
    }
  }

  async getThreatCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = req.params.category as ThreatCategory;
      if (!Object.values(ThreatCategory).includes(category)) {
        sendError(res, 'INVALID_CATEGORY', 'Invalid threat category', 400);
        return;
      }

      const result = {
        category,
        description: this.classificationService.getCategoryDescription(category),
        behavior: this.classificationService.getCategoryBehavior(category),
      };
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 'THREAT_ERROR', 'Failed to retrieve threat category', 500);
    }
  }
}
