import { getAllPublicKeys, createWallet } from "../controllers/apiMethods.js";
import { Router } from "express";
const router = Router();

router.get('/getAllPublicKeys', getAllPublicKeys);
router.get('/createWallet', createWallet);

export default router;