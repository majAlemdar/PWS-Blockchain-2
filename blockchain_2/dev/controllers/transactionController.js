import Transaction from '../lib/transaction.js';
import { bascoin, wallet } from '../lib/node_model.js';


export async function createAndBroadCastTransaction(req, res) {
    const { senderPublicKeyBase64, recipientPublicKeyBase64, amount } = req.body;

    //wallets nemen, zodat we de pem format krijgen
    const { publicKeyPem: senderPublicKeyPem, privateKeyPem: senderPrivateKeyPem } = wallet.getWalletByPublicKeyBase64(senderPublicKeyBase64);
    const { publicKeyPem: recipientPublicKeyPem } = wallet.getWalletByPublicKeyBase64(recipientPublicKeyBase64);

    // tx met unieke handtekening
    const newTransaction = Transaction.createSignedTransaction(senderPublicKeyPem, senderPrivateKeyPem, recipientPublicKeyPem, amount);
    console.log(newTransaction);

    // verificatie voor de handtekening
    const isValid = Transaction.verifyTransaction(newTransaction, senderPublicKeyPem);
    if (!isValid) return res.status(400).json({ msg: "Ongeldige handtekening (de keys komen niet overeen). Transactie is geweigerd." });
    
    console.log('succesvol geverifieerd');

    // tx toevoegen aan de mempool
    bascoin.addTransactionToMempool(newTransaction);

    if (bascoin.networkNodes.length >= 1) {
        // broadcasten naar de andere nodes
        const broadcastResults = bascoin.networkNodes.map(async (node) => {
            try {
                const response = await fetch(`${node}/transaction/process-transaction`, {
                    method: 'POST',
                    body: JSON.stringify({ newTransaction, senderPublicKeyPem }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();
                return { node, status: "succes", result };
            } catch (error) {
                console.log(`Node ${node} faalt: ${error}`);
                return { node, status: 'fail', error };
            }
        });
        const results = await Promise.allSettled(broadcastResults);
        return res.json({ msg: "Tx is aangemaakt, geverifieerd, toegevoegd aan de mempool en broadcasted naar het hele netwerk. Zie blockchain mempool voor meer info.", success: true, newTransaction, results });
    }

    return res.json({ msg: 'Tx is gemaakt en toegevoegd aan de mempool.', newTransaction });
};

export function processTransaction(req, res) {
    const { newTransaction, senderPublicKeyPem } = req.body;
    // console.log(newTransaction);

    //elk node controleert de handtekening
    const isValid = Transaction.verifyTransaction(newTransaction, senderPublicKeyPem);
    if (!isValid) return res.status(400).json({ msg: "Ongeldige transactie. Signature verification failed." });

    const nextBlockIndex = bascoin.addTransactionToMempool(newTransaction);
    res.json({ msg: `Tx ontvangen. Zal in blok ${nextBlockIndex} worden opgenomen.` });
};