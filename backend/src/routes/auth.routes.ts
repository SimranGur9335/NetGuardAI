import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { container } from '../container';
import { requireAuth } from '../middleware/auth';

const router = Router();
const controller = new AuthController(container.authService);

router.post('/login', (req, res) => controller.login(req, res));
router.get('/me', requireAuth(container.authService), (req, res) => controller.me(req, res));
router.post('/logout', requireAuth(container.authService), (req, res) => controller.logout(req, res));

export default router;
