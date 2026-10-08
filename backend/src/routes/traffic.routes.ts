import { Router } from 'express';
import { TrafficController } from '../controllers/TrafficController';
import { container } from '../container';

const router = Router();
const controller = new TrafficController(container.trafficService);

router.get('/', (req, res) => controller.getTraffic(req, res));
router.get('/activity', (req, res) => controller.getActivity(req, res));
router.get('/:id', (req, res) => controller.getTrafficById(req, res));

export default router;
