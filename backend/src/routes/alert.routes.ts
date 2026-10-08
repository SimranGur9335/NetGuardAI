import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';
import { container } from '../container';

const router = Router();
const controller = new AlertController(container.alertService);

router.get('/', (req, res) => controller.getAlerts(req, res));
router.get('/counts', (req, res) => controller.getAlertCounts(req, res));
router.get('/:id', (req, res) => controller.getAlertById(req, res));
router.patch('/:id/acknowledge', (req, res) => controller.acknowledgeAlert(req, res));
router.patch('/:id/resolve', (req, res) => controller.resolveAlert(req, res));

export default router;
