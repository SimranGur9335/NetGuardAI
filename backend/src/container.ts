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
import { SimulationService } from './services/SimulationService';

// Shared repository instances — created ONCE
const trafficRepository = new InMemoryTrafficRepository();
const alertRepository = new InMemoryAlertRepository();
const predictionRepository = new InMemoryPredictionRepository();
const statisticsRepository = new InMemoryStatisticsRepository(
  trafficRepository.getAll(),
  alertRepository.getAll()
);

// Shared service instances — wired together
const alertService = new AlertService(alertRepository);
const detectionService = new DetectionService(predictionRepository);
const classificationService = new ThreatClassificationService();
const trafficService = new TrafficService(
  trafficRepository,
  detectionService,
  classificationService,
  alertService
);
const dashboardService = new DashboardService(trafficRepository, alertRepository);
const modelService = new ModelService();
const evaluationService = new EvaluationService(modelService);
const simulationService = new SimulationService(trafficService);

export const container = {
  // Repositories
  trafficRepository,
  alertRepository,
  predictionRepository,
  statisticsRepository,
  // Services
  trafficService,
  detectionService,
  classificationService,
  alertService,
  dashboardService,
  modelService,
  evaluationService,
  simulationService,
};
