import { TrafficEvent, TrafficQueryParams, PaginatedResponse, ThreatCategory } from '../models';
import { ITrafficRepository } from '../repositories/interfaces/ITrafficRepository';
import { DetectionService } from './DetectionService';
import { ThreatClassificationService } from './ThreatClassificationService';
import { AlertService } from './AlertService';
import { generateEventId } from '../utils/idGenerator';
import { logger } from '../utils/logger';

export class TrafficService {
  constructor(
    private trafficRepository: ITrafficRepository,
    private detectionService: DetectionService,
    private classificationService: ThreatClassificationService,
    private alertService: AlertService
  ) {}

  async processTrafficEvent(event: Omit<TrafficEvent, 'id' | 'timestamp' | 'classification' | 'isSuspicious'>): Promise<TrafficEvent> {
    const trafficEvent: TrafficEvent = {
      ...event,
      id: generateEventId(),
      timestamp: new Date().toISOString(),
      classification: ThreatCategory.NORMAL,
      isSuspicious: false,
    };

    // Detection stage
    const detectionResult = await this.detectionService.detect(trafficEvent);
    trafficEvent.classification = detectionResult.classification;
    trafficEvent.isSuspicious = detectionResult.classification !== ThreatCategory.NORMAL;

    // Classification stage (only for suspicious traffic)
    if (trafficEvent.isSuspicious) {
      const classification = this.classificationService.classify(
        detectionResult.classification,
        trafficEvent.protocol,
        trafficEvent.packetSize,
        trafficEvent.flags
      );
      trafficEvent.severity = classification.severity;
      trafficEvent.description = classification.description;

      // Alert generation
      await this.alertService.createAlert({
        category: classification.category,
        severity: classification.severity,
        sourceIp: trafficEvent.sourceIp,
        destinationIp: trafficEvent.destinationIp,
        protocol: trafficEvent.protocol,
        description: classification.description,
        prediction: `${detectionResult.classification} (${(detectionResult.confidence * 100).toFixed(1)}%)`,
        detectionSource: 'DevelopmentDetectionModel',
      });
    }

    await this.trafficRepository.save(trafficEvent);
    return trafficEvent;
  }

  async getTrafficEvents(params?: TrafficQueryParams): Promise<PaginatedResponse<TrafficEvent>> {
    return this.trafficRepository.findAll(params);
  }

  async getTrafficEventById(id: string): Promise<TrafficEvent | null> {
    return this.trafficRepository.findById(id);
  }

  async getTrafficActivity(): Promise<{ timestamp: string; normal: number; suspicious: number }[]> {
    return this.trafficRepository.findActivityTimeline();
  }

  async getTrafficCounts(): Promise<{
    total: number;
    byClassification: Record<string, number>;
  }> {
    const [total, byClassification] = await Promise.all([
      this.trafficRepository.count(),
      this.trafficRepository.countByClassification(),
    ]);
    return { total, byClassification };
  }
}
