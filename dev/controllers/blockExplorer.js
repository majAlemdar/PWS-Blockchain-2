import { bascoin, wallet } from '../lib/node_model.js';

export function getBlockchain(req, res) { res.json(bascoin); };

export function getAddressData(req, res) {
    const { publicKey } = req.body; //{base64}

    const userWallet = wallet.getWalletByPublicKeyBase64(publicKey);
    if (!userWallet) return res.status(500).json({ msg: 'Reload.', success: false }); //wss server side wijziging, dus reload zal het oplossen

    res.json(userWallet);
};