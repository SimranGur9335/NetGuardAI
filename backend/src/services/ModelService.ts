import { ModelInfo, EvaluationResult, EvaluationMetrics, ConfusionMatrix } from '../models';

/**
 * ModelService
 * Provides information about detection models used in the system.
 * The active engine is a rule-based development detector — NOT a trained ML
 * model. Planned ML models are reported as "Not Trained" until training and
 * evaluation actually happen. No metrics are ever fabricated.
 */
export class ModelService {
  private models: ModelInfo[] = [
    {
      id: 'dev-flow-model',
      name: 'Development Detection Engine',
      type: 'Rule-based flow analysis (not a trained ML model)',
      status: 'Operational',
      detectionStage: 'Intrusion detection',
      classificationStage: 'Threat classification',
      evaluationStatus: 'Not Applicable — rules-based, no trained metrics',
    },
    {
      id: 'rf-model',
      name: 'Random Forest',
      type: 'Ensemble Learning',
      status: 'Not Trained',
      detectionStage: 'Intrusion detection',
      classificationStage: 'Suspicious traffic classification',
      evaluationStatus: 'Not Available',
    },
    {
      id: 'xgb-model',
      name: 'XGBoost',
      type: 'Gradient Boosting',
      status: 'Not Trained',
      detectionStage: 'Intrusion detection',
      classificationStage: 'Threat classification',
      evaluationStatus: 'Not Available',
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
      status: 'Not Trained',
      metrics,
      confusionMatrix,
      message:
        'Not Trained / Not Available. No trained model exists yet, so accuracy, precision, recall, F1 and confusion matrix are unavailable. Results will be populated only after dataset collection, training and evaluation.',
    };
  }

  async getAllEvaluations(): Promise<EvaluationResult[]> {
    return Promise.all(this.models.map((m) => this.getEvaluation(m.id)));
  }
}
