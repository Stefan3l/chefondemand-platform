import { Router } from 'express';
import { LoginChefController } from '../controllers/LoginChefController';

const router = Router();

router.post('/chef/login', LoginChefController);

export default router;
