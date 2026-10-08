import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { container } from '../container';

const router = Router();
const controller = new DashboardController(container.dashboardService);

router.get('/summary', (req, res) => controller.getSummary(req, res));

export default router;
