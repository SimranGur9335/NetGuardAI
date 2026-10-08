import { Router } from 'express';
import dashboardRoutes from './dashboard.routes';
import trafficRoutes from './traffic.routes';
import alertRoutes from './alert.routes';
import threatRoutes from './threat.routes';
import modelRoutes from './model.routes';
import systemRoutes from './system.routes';
import authRoutes from './auth.routes';
import monitoringRoutes from './monitoring.routes';
import { SystemController } from '../controllers/SystemController';
import { container } from '../container';
import { requireAuth } from '../middleware/auth';

const router = Router();
const systemController = new SystemController(container.captureService);
const authMiddleware = requireAuth(container.authService);

// Public endpoints
router.use('/auth', authRoutes);
router.get('/health', (req, res) => systemController.getHealth(req, res));

// Protected endpoints — require authentication
router.use('/dashboard', authMiddleware, dashboardRoutes);
router.use('/traffic', authMiddleware, trafficRoutes);
router.use('/alerts', authMiddleware, alertRoutes);
router.use('/threats', authMiddleware, threatRoutes);
router.use('/models', authMiddleware, modelRoutes);
router.use('/system', authMiddleware, systemRoutes);
router.use('/monitoring', authMiddleware, monitoringRoutes);

export default router;
