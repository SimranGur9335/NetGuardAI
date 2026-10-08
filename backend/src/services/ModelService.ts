import { ModelInfo, EvaluationResult, EvaluationMetrics, ConfusionMatrix } from '../models';

/**
 * ModelService
 * Provides information about ML models used in the system.
 * Currently returns development/simulation model information.
 */
export class ModelService {
  private models: ModelInfo[] = [
    {
      id: 'rf-model',
      name: 'Random Forest',
      type: 'Ensemble Learning',
      status: 'Available for integration',
      detectionStage: 'Intrusion detection',
      classificationStage: 'Suspicious traffic classification',
      evaluationStatus: 'Pending',
    },
    {
      id: 'xgb-model',
      name: 'XGBoost',
      type: 'Gradient Boosting',
      status: 'Available for integration',
      detectionStage: 'Intrusion detection',
      classificationStage: 'Threat classification',
      evaluationStatus: 'Pending',
    },
  ];

  async getModels(): Promise<ModelInfo[]> {
    return this.models;
  }

  async getModelById(id: string): Promise<ModelInfo | null> {
    return this.models.find((m) => m.id === id) || null;
  }

  async getEvaluation(modelId: string): Promise<EvaluationResult> {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const metrics: EvaluationMetrics = {
      accuracy: null,
      precision: null,
      recall: null,
      f1Score: null,
    };

    const confusionMatrix: ConfusionMatrix = {
      labels: ['Normal', 'DoS/DDoS', 'Brute Force', 'Port Scan'],
      values: null,
    };

    return {
      modelId: model.id,
      modelName: model.name,
      status: 'Not evaluated',
      metrics,
      confusionMatrix,
      message: 'Evaluation data not available yet. Experimental results will be populated after model training and testing.',
    };
  }

  async getAllEvaluations(): Promise<EvaluationResult[]> {
    return Promise.all(this.models.map((m) => this.getEvaluation(m.id)));
  }
}
