import { consensus } from '../controllers/consensusController.js';
import { Router } from 'express';

const router = Router();

router.get('/', consensus);

export default router;