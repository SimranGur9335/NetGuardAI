import { Router } from 'express';
import { SimulationController } from '../controllers/SimulationController';
import { container } from '../container';

const router = Router();
const controller = new SimulationController(container.simulationService);

router.post('/start', (req, res) => controller.start(req, res));
router.post('/stop', (req, res) => controller.stop(req, res));
router.get('/status', (req, res) => controller.status(req, res));

export default router;
