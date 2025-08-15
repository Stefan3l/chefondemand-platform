import { Router } from 'express';
import { registerChef } from '../controllers/ChefsController';

const router = Router();

// create chef (registration)
router.post('/registration', registerChef);

export default router;