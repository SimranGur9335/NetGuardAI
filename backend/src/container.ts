import bcrypt from 'bcryptjs';
import { InMemoryTrafficRepository } from './repositories/memory/InMemoryTrafficRepository';
import { InMemoryAlertRepository } from './repositories/memory/InMemoryAlertRepository';
import { InMemoryPredictionRepository } from './repositories/memory/InMemoryPredictionRepository';
import { InMemoryStatisticsRepository } from './repositories/memory/InMemoryStatisticsRepository';
import { TrafficService } from './services/TrafficService';
import { DetectionService } from './services/DetectionService';
import { ThreatClassificationService } from './services/ThreatClassificationService';
import { AlertService } from './services/AlertService';
import { DashboardService } from './services/DashboardService';
import { ModelService } from './services/ModelService';
import { EvaluationService } from './services/EvaluationService';
import { AuthService } from './services/AuthService';
import { PacketCaptureService } from './services/capture/PacketCaptureService';
import { PacketNormalizer } from './services/capture/PacketNormalizer';
import { FeatureExtractor } from './services/capture/FeatureExtractor';
import { config } from './config';
import { logger } from './utils/logger';

// Hash the admin password at startup — never store plaintext in code
const adminPasswordHash = bcrypt.hashSync(config.adminPassword, 10);

// Shared repository instances — created ONCE (in-memory only, no database)
const trafficRepository = new InMemoryTrafficRepository();
const alertRepository = new InMemoryAlertRepository();
const predictionRepository = new InMemoryPredictionRepository();
const statisticsRepository = new InMemoryStatisticsRepository(
  trafficRepository.getAll(),
  alertRepository.getAll()
);

// Shared service instances — wired together
const authService = new AuthService(config.adminEmail, adminPasswordHash);
const alertService = new AlertService(alertRepository);
const detectionService = new DetectionService(predictionRepository);
const classificationService = new ThreatClassificationService();
const trafficService = new TrafficService(
  trafficRepository,
  detectionService,
  classificationService,
  alertService
);
const captureService = new PacketCaptureService();
const packetNormalizer = new PacketNormalizer();
const featureExtractor = new FeatureExtractor();
const dashboardService = new DashboardService(trafficRepository, alertRepository, captureService);
const modelService = new ModelService();
const evaluationService = new EvaluationService(modelService);

// ------------------------------------------------------------------
// REAL capture pipeline:
//   tshark/Npcap packet -> normalize -> extract features -> detection
//   -> classification -> alert engine -> shared in-memory repository.
// There is NO simulation fallback. If capture is unavailable, no events flow.
// ------------------------------------------------------------------
captureService.onPacket((packet) => {
  try {
    const normalized = packetNormalizer.normalize(packet);
    const features = featureExtractor.extract(normalized);
    const trafficInput = featureExtractor.toTrafficEvent(normalized, features);
    void trafficService.processTrafficEvent(trafficInput).catch((err) => {
      logger.error('Failed to process captured packet', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    });
  } catch (err) {
    logger.error('Capture pipeline error', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

export const container = {
  // Repositories
  trafficRepository,
  alertRepository,
  predictionRepository,
  statisticsRepository,
  // Services
  authService,
  trafficService,
  detectionService,
  classificationService,
  alertService,
  dashboardService,
  modelService,
  evaluationService,
  captureService,
};
