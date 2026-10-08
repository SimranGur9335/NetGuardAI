import { Router } from 'express';
import dashboardRoutes from './dashboard.routes';
import trafficRoutes from './traffic.routes';
import alertRoutes from './alert.routes';
import threatRoutes from './threat.routes';
import modelRoutes from './model.routes';
import systemRoutes from './system.routes';
import simulationRoutes from './simulation.routes';
import { SystemController } from '../controllers/SystemController';

const router = Router();
const systemController = new SystemController();

// Health check at root level
router.get('/health', (req, res) => systemController.getHealth(req, res));

router.use('/dashboard', dashboardRoutes);
router.use('/traffic', trafficRoutes);
router.use('/alerts', alertRoutes);
router.use('/threats', threatRoutes);
router.use('/models', modelRoutes);
router.use('/system', systemRoutes);
router.use('/simulation', simulationRoutes);

export default router;
