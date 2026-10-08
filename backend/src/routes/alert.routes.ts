import { Router } from 'express';
import { AlertController } from '../controllers/AlertController';
import { container } from '../container';
import { requireRole } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();
const controller = new AlertController(container.alertService);
const adminOnly = requireRole(UserRole.ADMIN);

// Reads: any authenticated user
router.get('/', (req, res) => controller.getAlerts(req, res));
router.get('/counts', (req, res) => controller.getAlertCounts(req, res));
router.get('/:id', (req, res) => controller.getAlertById(req, res));

// Acknowledge/resolve: admin only
router.patch('/:id/acknowledge', adminOnly, (req, res) => controller.acknowledgeAlert(req, res));
router.patch('/:id/resolve', adminOnly, (req, res) => controller.resolveAlert(req, res));

export default router;
