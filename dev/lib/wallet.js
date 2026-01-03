
import fs from 'fs'; //file system
import crypto from 'crypto';

import path from 'path';
import { fileURLToPath } from 'url';

// realtieve pad
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Wallet {

    constructor(port) {
        this.port = port;
    }

    // functie om users directory PER NODE (poort) te bepalen en aan te maken
    getUsersDir() {
        const dir = path.join(__dirname, '..', 'users', `users_${this.port}`);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    createWallet() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },   //!formaat uitleg
            privateKeyEncoding: { type: 'pkcs1', format: 'pem' }    //!formaat uitleg
        });

        const shortName = crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 30);
        const fileName = `wallet_${shortName}.json`;

        // base64-versies (geen header en footer) voor tonen in UI
        const base64PublicKey = publicKey.replace(/-----BEGIN [\w\s]+-----/, '').replace(/-----END [\w\s]+-----/, '').replace(/\s+/g, '');
        const base64PrivateKey = privateKey.replace(/-----BEGIN [\w\s]+-----/, '').replace(/-----END [\w\s]+-----/, '').replace(/\s+/g, '');

        const walletData = {
            publicKeyPem: publicKey,    // voor verify()
            privateKeyPem: privateKey,  // nodig voor sign()
            shortName: shortName,
            amount: parseInt(1000), //1000 coins voor iedereen
            createdAt: Date.now(),

            //voor de frontend
            publicKeyBase64: base64PublicKey,
            privateKeyBase64: base64PrivateKey
        };

        const usersDir = this.getUsersDir();
        const filePath = path.join(usersDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2)); //netjes format
        console.log(`Wallet opgeslagen: ${filePath}`);
        return walletData;
    }

    getAllWallets() {
        const usersDir = this.getUsersDir();

        if (!fs.existsSync(usersDir)) return [];

        return fs.readdirSync(usersDir)
            .filter(file => file.endsWith('.json'))
            .map(file => JSON.parse(fs.readFileSync(path.join(usersDir, file))));
    }

    getAllPublicKeys() {
        const usersDir = this.getUsersDir();

        if (!fs.existsSync(usersDir)) return [];

        return fs.readdirSync(usersDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const wallet = JSON.parse(fs.readFileSync(path.join(usersDir, file)));
                return wallet.publicKeyBase64;
            });
    }

    getWalletByPublicKeyBase64(publicKeyBase64) {
        console.log(publicKeyBase64);
        const usersDir = path.join(__dirname, '..', 'users');
        const subDirs = fs.readdirSync(usersDir).filter(f => {
            const fullPath = path.join(usersDir, f);
            return fs.statSync(fullPath).isDirectory();
        });

        for (const dir of subDirs) {
            const folderPath = path.join(usersDir, dir);
            const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const wallet = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                if (wallet.publicKeyBase64 === publicKeyBase64) {
                    return wallet;
                }
            }
        }

        return null;
    }

    getWalletByPublicKeyPEM(publicKeyPem) {
        // console.log(publicKeyPem);
        const usersDir = path.join(__dirname, '..', 'users');
        const subDirs = fs.readdirSync(usersDir).filter(f => {
            const fullPath = path.join(usersDir, f);
            return fs.statSync(fullPath).isDirectory();
        });

        for (const dir of subDirs) {
            const folderPath = path.join(usersDir, dir);
            const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const wallet = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                if (wallet.publicKeyPem === publicKeyPem) {
                    wallet.filePath = filePath; //path nodig voor het 'uitbetalingen'
                    return wallet;
                }
            }
        }

        return null;
    }

    //!CONFIG: bij het automatisch opstarten, nieuwe wallets genereren: 
    resetUserWalletsOnStartup() {
        const usersDir = this.getUsersDir();

        //als de users dir niet bestaat dan doen we niks
        if (!fs.existsSync(usersDir)) return;
        //verwijderen we de dir als 
        fs.rmSync(usersDir, { recursive: true, force: true });
    }
};