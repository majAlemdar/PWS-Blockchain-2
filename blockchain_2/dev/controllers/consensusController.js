import { bascoin } from '../lib/node_model.js';

export async function consensus(req, res) {
    try {
        const blockchainResponses = bascoin.networkNodes.map(async (node) => {
            try {
                const response = await fetch(`${node}/explore/blockchain`, { headers: { 'Content-Type': 'application/json' } });
                const blockchain = await response.json();
                return { blockchain, success: true };
            } catch (error) {
                // console.log(error);
                return { node, success: false, error: error };
            };
        });
        const blockchainResults = await Promise.allSettled(blockchainResponses);

        const blockchains = blockchainResults
            .filter(result => result.status === "fulfilled" && result.value.success === true)
            .map(result => result.value.blockchain); // alleen de chain zelf nemen

        //console.log(blockchains[0].chain);
        //Juiste mempool en genesisblock vinden - we nemen aan dat alle chains geldig zijn.
        let newLongestChain = null;
        let newMempool = null;

        //er is alleen maar genesis block, dus we kijken naar timestamp
        for (const blockchain of blockchains) {
            const currentGenesisTimestamp = bascoin.chain[0].timestamp;
            const otherGenesisTimestamp = blockchain.chain[0].timestamp;

            // we kiezen de keten met de oudste timestamp (hoe ouder, hoe kleiner de waarde)
            if ((otherGenesisTimestamp < currentGenesisTimestamp)) {
                newMempool = blockchain.mempool;
                newLongestChain = blockchain.chain;
            };
        };

        if (newLongestChain) {
            bascoin.chain = newLongestChain;
            bascoin.mempool = newMempool;
            res.json({ msg: "Oude chain is vervangen door een langere chain.", chain: bascoin.chain });
            // console.log("Oude keten is vervangen door een langere chain.");
        } else res.json({ msg: "Chain is niet vervangen.", chain: bascoin.chain });

    } catch (error) {
        console.log(error);
    };
};