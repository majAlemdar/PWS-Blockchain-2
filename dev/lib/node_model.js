import Blockchain from './blockchain.js';
import Wallet from './wallet.js';

const PORT = process.argv[process.argv.length - 1]; //verschilt per node, zie npm command
const currentNodeAddress = `http://localhost:${PORT}`; //unieke adres van deze node

const bascoin = new Blockchain(currentNodeAddress);
const wallet = new Wallet(PORT);

export { bascoin, wallet, currentNodeAddress, PORT }; 