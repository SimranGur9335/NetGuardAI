import { EvaluationResult } from '../models';
import { ModelService } from './ModelService';

/**
 * EvaluationService
 * Manages model evaluation data and status.
 * Currently returns empty/pending states as no experimental results exist.
 */
export class EvaluationService {
  constructor(private modelService: ModelService) {}

  async getEvaluationStatus(): Promise<{
    overallStatus: string;
    message: string;
    evaluations: EvaluationResult[];
  }> {
    const evaluations = await this.modelService.getAllEvaluations();

    return {
      overallStatus: 'Not Trained',
      message:
        'Not Trained / Not Available. No experimental results exist — metrics will only be reported after dataset collection and model training.',
      evaluations,
    };
  }

  async getModelEvaluation(modelId: string): Promise<EvaluationResult> {
    return this.modelService.getEvaluation(modelId);
  }
}
