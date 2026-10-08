import { ThreatCategory, TrafficEvent } from '../models';
import { generatePredictionId } from '../utils/idGenerator';
import { IPredictionRepository } from '../repositories/interfaces/IPredictionRepository';
import { Prediction } from '../models';

/**
 * DetectionModel interface - abstraction for ML-based detection.
 * Later implementations can use Random Forest, XGBoost, etc.
 */
export interface DetectionModel {
  predict(event: TrafficEvent): Promise<{
    classification: ThreatCategory;
    confidence: number;
  }>;
  getModelInfo(): {
    name: string;
    type: string;
    status: string;
  };
}

/**
 * DevelopmentDetectionModel - temporary implementation for development.
 * Uses rule-based heuristics to simulate detection results.
 * This is NOT a real ML model and will be replaced later.
 */
export class DevelopmentDetectionModel implements DetectionModel {
  async predict(event: TrafficEvent): Promise<{
    classification: ThreatCategory;
    confidence: number;
  }> {
    // Simple rule-based detection for demonstration
    // In production, this would be a trained ML model

    // Check for DoS/DDoS patterns
    if (event.flags.includes('SYN') && event.flags.includes('SYN-ACK')) {
      return { classification: ThreatCategory.DOS_DDOS, confidence: 0.85 };
    }

    // Check for port scan patterns
    if (event.flags.includes('SYN') && !event.flags.includes('ACK')) {
      return { classification: ThreatCategory.PORT_SCAN, confidence: 0.78 };
    }

    // Check for brute force patterns
    if (event.protocol === 'SSH' && event.flags.includes('AUTH')) {
      return { classification: ThreatCategory.BRUTE_FORCE, confidence: 0.82 };
    }

    // Default to normal
    return { classification: ThreatCategory.NORMAL, confidence: 0.95 };
  }

  getModelInfo() {
    return {
      name: 'Development Detection Model',
      type: 'Rule-based heuristic (temporary)',
      status: 'Development',
    };
  }
}

export class DetectionService {
  private model: DetectionModel;

  constructor(
    private predictionRepository: IPredictionRepository,
    model?: DetectionModel
  ) {
    this.model = model || new DevelopmentDetectionModel();
  }

  async detect(event: TrafficEvent): Promise<{
    classification: ThreatCategory;
    confidence: number;
    prediction: Prediction;
  }> {
    const result = await this.model.predict(event);

    const prediction: Prediction = {
      id: generatePredictionId(),
      timestamp: new Date().toISOString(),
      trafficEventId: event.id,
      classification: result.classification,
      confidence: result.confidence,
      model: this.model.getModelInfo().name,
    };

    await this.predictionRepository.save(prediction);

    return {
      classification: result.classification,
      confidence: result.confidence,
      prediction,
    };
  }

  getModelInfo() {
    return this.model.getModelInfo();
  }
}
