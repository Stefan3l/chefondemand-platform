import { Router } from 'express';
import { registerChef } from '../modules/chefs/chefs.controller';

const router = Router();

// create chef (registration)
router.post('/registration', registerChef);

export default router;