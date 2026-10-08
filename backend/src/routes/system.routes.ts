import { Router } from 'express';
import { SystemController } from '../controllers/SystemController';
import { container } from '../container';

const router = Router();
const controller = new SystemController(container.captureService);

router.get('/health', (req, res) => controller.getHealth(req, res));
router.get('/status', (req, res) => controller.getStatus(req, res));

export default router;
