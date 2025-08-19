import { Router } from 'express';
import { LoginChefController } from '../controllers/LoginChefController';
import { MeChefController } from '../controllers/MeChefController';
import { authJwtMiddleware } from '../middleware/authJwtMiddleware';

const router = Router();

router.post('/chef/login', LoginChefController);
router.get('/chef/me', authJwtMiddleware, MeChefController);

export default router;
