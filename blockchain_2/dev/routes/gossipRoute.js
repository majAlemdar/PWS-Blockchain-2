
import {registerAndBroadcastNewNode, registerNode, registerNodesBulk} from '../controllers/gossipControllers.js'
import { Router } from 'express';

const router = Router();

//Onderstaande 3 endpoints werken samen --> Gossip Protocol model:
//STAP 1: NIEUWE NODE REGISTREREN EN BROADCASTEN NAAR DE REST
router.post('/register-and-broadcast-node', registerAndBroadcastNewNode);
//STAP 2: REST REGISTREERT DE NIEUWE NODE:
router.post('/register-node', registerNode);
//STAP 3: NIEUWE NODE REGISTREERT HET HELE NETWERK:
router.post('/register-nodes-bulk', registerNodesBulk)

export default router;