import { getBlockchain, getAddressData} from '../controllers/blockExplorer.js'
import { Router } from 'express';

const router = Router();

//Block explorer:
router.get('/blockchain', getBlockchain);
router.post('/address-data', getAddressData);

export default router;