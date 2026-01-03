import { wallet } from '../lib/node_model.js';

export function getAllPublicKeys(req, res) {
    const publicKeys = wallet.getAllPublicKeys();
    res.json({ publicKeys });
};

export function createWallet(req, res) {
    const walletData = wallet.createWallet();
    res.send(walletData);
};