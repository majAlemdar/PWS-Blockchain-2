import { createAndBroadCastTransaction, processTransaction } from '../controllers/transactionController.js';
import { Router } from 'express';
import Transaction from '../lib/transaction.js';

const router = Router();

//BIJ DE EERSTE NODE:
router.post('/create-and-broadcast', Transaction.verifyTransactionBeforeHand, createAndBroadCastTransaction);
//TIJDENS BROADCASTEN:
router.post('/process-transaction', processTransaction);

export default router;