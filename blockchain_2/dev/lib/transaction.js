import crypto from 'crypto';
import { wallet } from './node_model.js';

// senderPrivateKey     - PEM string van afzender
// senderPublicKey      - PEM string publicKey van afzender
// recipientPublicKey   - PEM string publicKey van ontvanger
// amount               - number

export default class Transaction {

    static generateTxID(data) {
        //2x hashen:
        const firstHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest(); //buffer
        const secondHash = crypto.createHash('sha256').update(firstHash).digest('hex'); //hex
        return secondHash;
    };

    static createSignedTransaction(senderPublicKey, senderPrivateKey, recipientPublicKey, amount) {
        //pem format voor het ondertekenen
        const transactionData = {
            sender: senderPublicKey,
            recipient: recipientPublicKey,
            amount,
            timestamp: Date.now(),
        };

        const txid = Transaction.generateTxID(transactionData);

        const fullTransaction = {
            ...transactionData,
            txid
        };

        const sign = crypto.createSign('SHA256');
        sign.update(JSON.stringify(fullTransaction));
        sign.end();

        const signature = sign.sign(senderPrivateKey, 'base64');

        // definitieve transactie returneren:
        return {
            ...fullTransaction,
            signature
        };
    };

    //controle door andere nodes
    static verifyTransaction(transaction, senderPublicKeyPem) {
        // pem formaat
        const { sender, recipient, amount, timestamp, txid, signature } = transaction;

        const verify = crypto.createVerify('SHA256');
        verify.update(JSON.stringify({ sender, recipient, amount, timestamp, txid }));
        verify.end();

        const isVerified = verify.verify(senderPublicKeyPem, signature, 'base64');
        return isVerified;
    };

    //middleware - controle (bij de node die de tx verstuurd)
    static verifyTransactionBeforeHand(req, res, next) {
        const { senderPublicKeyBase64, senderPrivateKeyBase64, recipientPublicKeyBase64, amount } = req.body;
        const parsedAmount = parseInt(amount);
        console.log(parsedAmount)

        if (!senderPublicKeyBase64 || !senderPrivateKeyBase64 || !recipientPublicKeyBase64 || !parsedAmount || parsedAmount <= 0 || isNaN(amount)) return res.status(400).json({ msg: "Ongeldige invoer." });
        if (senderPublicKeyBase64 === recipientPublicKeyBase64) return res.status(400).json({ msg: "Ongeldige invoer." });

        // Bestaan de adressen?
        const senderWallet = wallet.getWalletByPublicKeyBase64(senderPublicKeyBase64);
        const recipientWallet = wallet.getWalletByPublicKeyBase64(recipientPublicKeyBase64);

        if (!senderWallet || !recipientWallet) return res.status(400).json({ msg: "Ongeldige invoer." });
        if (senderWallet.privateKeyBase64 != senderPrivateKeyBase64) return res.status(400).json({ msg: "Ongeldige invoer." }); //controleren of de private key bij de public key hoort
        if (parseInt(senderWallet.amount) <= 0 || parseInt(senderWallet.amount) < parsedAmount)  return res.status(400).json({ msg: "Ongeldige invoer." });

        next();
    };
};