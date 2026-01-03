import { wallet, currentNodeAddress } from "../lib/node_model.js";
import { startGossip } from "./gossipControllers.js";

export async function start() {
    wallet.resetUserWalletsOnStartup();     // wallets resetten bij startup
    wallet.createWallet();                  // zodra de node start, eerste wallet aanmaken
    // Verzoek naar de vaste node, zodat de nieuwe node het netwerk joint..
    await startGossip(currentNodeAddress);
}