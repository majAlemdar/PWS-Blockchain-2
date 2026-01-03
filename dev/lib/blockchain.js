export default class Blockchain {

    constructor(currentNodeAddress) {
        this.chain = [];   //hoofd keten
        this.mempool = []; //per blok verschilt
        this.currentNodeAddress = currentNodeAddress; //komt van networkNode.js
        this.networkNodes = []; //p2p model

        this.createNewBlock(100, '0', '0'); //genisisBlock
    }

    createNewBlock(nonce, prevBlockHash, hash, transactions = this.mempool) {
        const newBlock = {
            index: this.chain.length,
            timestamp: Date.now(),
            transactions,
            nonce,
            hash,
            prevBlockHash
        };

        this.mempool = []; //mempool leeg maken
        this.chain.push(newBlock);

        return newBlock;
    };

    //transactie wordt extern gemaakt in transaction.js
    addTransactionToMempool(transaction) {
        this.mempool.push(transaction);
        return (this.getLastBlock()['index'] + 1) //index van het blok waarin de nieuwe transactie zich zal bevinden
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1]; //laatste blok returneren
    };
};