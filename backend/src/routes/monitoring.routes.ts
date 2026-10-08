import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';
import { container } from '../container';
import { requireRole } from '../middleware/auth';
import { UserRole } from '../models';

const router = Router();
const controller = new MonitoringController(container.captureService);
const adminOnly = requireRole(UserRole.ADMIN);

// Reads: any authenticated user
router.get('/interfaces', (req, res) => controller.getInterfaces(req, res));
router.get('/status', (req, res) => controller.getStatus(req, res));

// Admin only: start/stop monitoring and interface selection
router.post('/start', adminOnly, (req, res) => controller.start(req, res));
router.post('/stop', adminOnly, (req, res) => controller.stop(req, res));

export default router;
