import { start } from './controllers/startUp.js';
import { PORT } from './lib/node_model.js';

import consensus_router from './routes/consensusRoute.js';
import gossip_router from './routes/gossipRoute.js';
import blockExplorer_router from './routes/blockExplorer_route.js';
import apiRoutes from './routes/apiRoutes.js';
import transaction_router from './routes/transaction_route.js';

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middlewares en public dir hosten:
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //voor form data
app.use(express.static(path.join(__dirname, 'public'))); //public dir static hosten

//endpoints:
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'blockchain.html')); });

app.use('/gossip', gossip_router);
app.use('/api', apiRoutes);
app.use('/explore', blockExplorer_router);
app.use('/transaction', transaction_router);
app.use('/consensus', consensus_router);

app.use((req, res) => { res.status(404).send('Pagina niet gevonden.'); });

app.listen(PORT, async () => {
    console.log(`Luisteren naar localhost:${PORT}`);
    await start();
});