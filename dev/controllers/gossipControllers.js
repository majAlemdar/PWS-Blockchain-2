import { bascoin, currentNodeAddress } from '../lib/node_model.js'; //bascoin class importeren

//Verzoek naar de vaste node om deel te nemen aan het netwerk
export async function startGossip(currentNode) {
    const fixedNode = 'http://localhost:3001';
    console.log(`Start gossip, huidige node: ${currentNode}`);
    if (fixedNode === currentNode) return; 

    try {
        const result = await fetchWithRetry(`${fixedNode}/gossip/register-and-broadcast-node`, {
            method: 'POST',
            body: JSON.stringify({ newNodeAddress: currentNode }),
            headers: { 'Content-Type': 'application/json' }
        }, 10, 1500); // Probeer 5 keer, wachttijd start bij 1.5s

        console.log(`Gossip gelukt: ${JSON.stringify(result)}`);
    } catch (error) {
        console.log(`Gossip mislukt, node is vervallen: ${error}`);
    };
};

//Soms fetch problemen, waarschijnlijk omdat de node nog niet helemaal was opgestart of bezig was met meerdere verzoeken tegelijkertijd.. Deze function voorkomt dat:
async function fetchWithRetry(url, options, maxRetries, delayMs) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`Waarschijnlijk een netwerk probleem: ${response.status}`);
            return await response.json(); // succes
        } catch (err) {
            console.log(`Poging ${attempt} mislukt (${url}): ${err.message}`);
            if (attempt === maxRetries) throw err; // stop na maxRetries
            await new Promise(resolve => setTimeout(resolve, attempt * delayMs));
        }
    }
};

//GOSSIP-PROTOCOL - nieuwe node neemt deel.
export async function registerAndBroadcastNewNode(req, res) {
    const { newNodeAddress } = req.body; //Bijv. http://localhost:3002

    //Controleren of de node al aanwezig is in het netwerk, zo niet voegen we het toe
    if (bascoin.networkNodes.indexOf(newNodeAddress) == -1 && currentNodeAddress != newNodeAddress) {
        bascoin.networkNodes.push(newNodeAddress);
        console.log(`Nieuwe node opgeslagen - Netwerk Nodes: ${bascoin.networkNodes}`);
    } else {
        res.json({ msg: "Node is al in het netwerk." });
        return;
    };

    //Gossip protocol - de nieuwe nodes p2p delen met andere bekende nodes:
    if (bascoin.networkNodes.length >= 1) {
        //verzoek naar "/register-node" van alle bekende nodes (stap 2)
        const registerNodeResults = bascoin.networkNodes.map(async (node) => {
            try {
                const response = await fetch(`${node}/gossip/register-node`, {
                    method: 'POST',
                    body: JSON.stringify({ newNodeAddress: newNodeAddress }), //nieuwe node doorsturen naar bekende nodes
                    headers: { 'Content-Type': 'application/json' }
                });
                const result = await response.json();

                if (!result.success) throw result.msg;
                return { node, success: result.success, result: result };

            } catch (error) {
                console.log(`Node ${node} faalt: ${error}`);
                return { node, success: 'false', error: error };
            };
        });
        const results = await Promise.allSettled(registerNodeResults);
        console.log(results);
    };

    //Nieuwe node registreert alle bekende nodes - verzoek naar '/register-nodes-bulk' v.d. nieuwe node (stap 3):
    const allNetworkNodes = [currentNodeAddress, ...bascoin.networkNodes];
    try {
        const resgisterNodesBulk = await fetch(`${newNodeAddress}/gossip/register-nodes-bulk`, {
            method: 'POST',
            body: JSON.stringify({ allNetworkNodes: allNetworkNodes }), //alle nodes
            headers: { 'Content-Type': 'application/json' }
        });
        const resgisterNodesBulkResult = await resgisterNodesBulk.json();
        console.log(resgisterNodesBulkResult);
        console.log(`**********Node Discovery Afgerond**********`); // CLI overzicht
    } catch (error) {
        console.log(error);
    };

    //blockchain synchroniseren, nl. de genesis block en mempool
    if (bascoin.networkNodes.length >= 1) {
        //genesis blok en transacties syncroniseren:
        try {
            const consensusResponses = allNetworkNodes.map(async (node) => {
                try {
                    const response = await fetch(`${node}/consensus`, { headers: { 'Content-Type': 'application/json' } });
                    const result = await response.json();
                    return { result };
                } catch (error) {
                    // console.log(error);
                    return { node, success: false, error: error };
                };
            });
            const consensusResults = await Promise.allSettled(consensusResponses);
            console.log(consensusResults);

        } catch (error) {
            console.log(error)
        }
    }

    res.json({ msg: "Alles gelukt - Nieuwe node is gesynchroniseerd met het netwerk.", success: true });
};

export function registerNode(req, res) {
    const { newNodeAddress } = req.body;

    //controleren of de node al aanwezig is in het netwerk en voorkomen dat de node zichzelf toevoegt aan zijn networkNodes[]
    if (bascoin.networkNodes.indexOf(newNodeAddress) == -1 && newNodeAddress != currentNodeAddress) {
        bascoin.networkNodes.push(newNodeAddress);
        res.json({ msg: "Nieuwe node succesvol ogeslagen.", currentNodeAddress: currentNodeAddress, success: true });
    } else res.json({ msg: "Node is al aanwezig in het netwerk.", success: false });
};

export function registerNodesBulk(req, res) {
    const { allNetworkNodes } = req.body;
    for (const node of allNetworkNodes) {
        if (bascoin.networkNodes.indexOf(node) == -1 && currentNodeAddress != node) bascoin.networkNodes.push(node);
    };
    res.json({ msg: "Nieuwe node heeft ook alle nodes ogeslagen.", finalNetwerk: allNetworkNodes });
};