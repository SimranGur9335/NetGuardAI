import { Request, Response } from 'express';
import { ModelService } from '../services/ModelService';
import { EvaluationService } from '../services/EvaluationService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class ModelController {
  constructor(
    private modelService: ModelService,
    private evaluationService: EvaluationService
  ) {}

  async getModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await this.modelService.getModels();
      sendSuccess(res, models);
    } catch (error) {
      sendError(res, 'MODEL_ERROR', 'Failed to retrieve models', 500);
    }
  }

  async getModelById(req: Request, res: Response): Promise<void> {
    try {
      const model = await this.modelService.getModelById(req.params.id);
      if (!model) {
        sendError(res, 'NOT_FOUND', 'Model not found', 404);
        return;
      }
      sendSuccess(res, model);
    } catch (error) {
      sendError(res, 'MODEL_ERROR', 'Failed to retrieve model', 500);
    }
  }

  async getEvaluationStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.evaluationService.getEvaluationStatus();
      sendSuccess(res, status);
    } catch (error) {
      sendError(res, 'EVALUATION_ERROR', 'Failed to retrieve evaluation status', 500);
    }
  }

  async getModelEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const evaluation = await this.evaluationService.getModelEvaluation(req.params.id);
      sendSuccess(res, evaluation);
    } catch (error) {
      sendError(res, 'EVALUATION_ERROR', 'Failed to retrieve model evaluation', 500);
    }
  }
}
