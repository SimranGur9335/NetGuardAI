import { Router } from 'express';
import { ModelController } from '../controllers/ModelController';
import { ModelService } from '../services/ModelService';
import { EvaluationService } from '../services/EvaluationService';

const router = Router();

// Dependencies
const modelService = new ModelService();
const evaluationService = new EvaluationService(modelService);
const controller = new ModelController(modelService, evaluationService);

router.get('/', (req, res) => controller.getModels(req, res));
router.get('/evaluation', (req, res) => controller.getEvaluationStatus(req, res));
router.get('/:id', (req, res) => controller.getModelById(req, res));
router.get('/:id/evaluation', (req, res) => controller.getModelEvaluation(req, res));

export default router;
