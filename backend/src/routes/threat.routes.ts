import { Router } from 'express';
import { ThreatController } from '../controllers/ThreatController';
import { ThreatClassificationService } from '../services/ThreatClassificationService';

const router = Router();

// Dependencies
const classificationService = new ThreatClassificationService();
const controller = new ThreatController(classificationService);

router.get('/', (req, res) => controller.getThreatCategories(req, res));
router.get('/:category', (req, res) => controller.getThreatCategory(req, res));

export default router;
