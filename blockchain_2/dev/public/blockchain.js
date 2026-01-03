const divHTML = `
    <div style="cursor: pointer;display: flex; justify-content: flex-end; margin: 10px 10px 0px 0px;"> <i style="font-size: 28px; color: whitesmoke;" class="fa-solid fa-rectangle-xmark close-transactie"></i> </div>
    <h1 class="h1-add-transactie" style="text-align: center;">Transactie maken</h1>
    <div id="inputs">
        <div style="padding-left: 20px;">
            <span">Je (verzender) Public key {base64}:</span>
            <div id="publicKey" style="width: 95%; overflow:auto; margin-top: 3px;"></div>
        </div>
        <hr style="width: 90%; height:1px; margin: 0px auto;">
        <div style="padding-left: 20px;">
            <span">Je (verzender) Private key {base64}:</span>
              <input type="text" id="privateKey" style="all:unset; border: 1px solid #fff; border-radius: 5px; padding:4px 12px ; width: 90% ; overflow:auto; margin-top: 3px;"></input>
        </div>
        <hr style="width: 90%; height:1px; margin: 0px auto;">

        <div style="padding-left: 20px;">
            <span>Ontvanger Public key {base64}:</span>
            <input type="text" id="recipientPublicKey" style="all:unset; border: 1px solid #fff; border-radius: 5px; padding:4px 12px ; width: 90% ; overflow:auto; margin-top:3px ;"></input>
        </div>

        <hr style="width: 90%; height:1px; margin: 0px auto;">
        <div style="padding-left: 20px;">
            <span>Bedrag available:</span>
            <div id="walletBalans">123</div>
        </div>
        <div style="padding-left: 20px;">
            <span>Bedrag:</span>
            <input autocomplete="off" id="amount" name="amount" type="number" placeholder="Bedrag" style="all: unset; padding: 6px 12px; border: 2px solid #fff; border-radius: 5px;">
        </div>
        <hr style="width: 90%; height:1px; margin: 0px auto;">
        <div style="width: 100%; display: flex; justify-content: center; align-items: center; padding-bottom: 20px;">
            <button name="submit" type="submit" id="submit-input" style="padding: 10px 16px; cursor: pointer;">Toevoegen</button>
        </div>
    </div>`;

const userSelect = document.querySelector('#userSelect');
const actionsDiv = document.querySelector('#actions');
const addUserBtn = document.querySelector('#addUserBtn');
const h2 = document.querySelector("#currentDomain");
const blockExplorerBtn = document.querySelector('#blockExplorer');
const searchTransactionBtn = document.querySelector('#searchTransaction');
const showAddressDataBtn = document.querySelector('#showAddressData');
const createTransactionBtn = document.querySelector('#createTransaction');
const mineBlockBtn = document.querySelector('#mineBlock');
const searchBlockBtn = document.querySelector('#searchBlock');

let users = []; //public keys vd users van deze node
const currentDomain = window.location.origin;
const url = new URL(currentDomain);
const port = url.port;

let selectedUser = '';
h2.textContent = `Node: ${currentDomain}`;

document.addEventListener('DOMContentLoaded', async () => {
    selectedUser = userSelect.value;
    if (selectedUser) {
        actionsDiv.style.display = 'flex';
        addUserBtn.style.display = 'none';
    } else {
        actionsDiv.style.display = 'none';
        addUserBtn.style.display = 'block';
    }

    try {
        document.title = `Blockchain UI: ${port}`;
        const response = await fetch(`${currentDomain}/api/getAllPublicKeys`, { headers: { 'Content-Type': 'application/json' } });
        const result = await response.json();
        // console.log(result);

        for (const pubKey of result.publicKeys) {
            users.push(pubKey);
            const optn = document.createElement('option');
            optn.value = pubKey;
            optn.textContent = `${pubKey.slice(0, 60)}...`;
            userSelect.appendChild(optn)
        }

    } catch (error) {
        console.log(error);
        alert('Herlaad pagina?');
    }
});

userSelect.addEventListener('change', () => {
    selectedUser = userSelect.value;
    if (selectedUser) {
        actionsDiv.style.display = 'flex';
        addUserBtn.style.display = 'none';
    } else {
        actionsDiv.style.display = 'none';
        addUserBtn.style.display = 'block';
    }
});

addUserBtn.addEventListener('click', async () => {
    const response = await fetch(`${currentDomain}/api/createWallet`);
    const result = await response.json();
    alert('Nieuwe user: ' + JSON.stringify(result, null, 2));
    location.reload();
});

createTransactionBtn.addEventListener('click', async () => {
    const blurDiv = document.createElement("div");
    const div = document.createElement("div");
    makeTransactiePopUp(blurDiv, div, divHTML);
    const closeTransactieBtn = div.querySelector(".close-transactie");
    closeTransactieBtn.addEventListener("click", () => {
        closeTransactiepopUp(blurDiv, div);
    });

    const selectedUserPublicKeybase64 = userSelect.value; //public key vd verzender (geselecteerde user)
    div.querySelector('#publicKey').textContent = selectedUserPublicKeybase64;

    const walletBalansDiv = document.querySelector("#walletBalans");
    const response = await fetch(`${currentDomain}/explore/address-data`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: selectedUserPublicKeybase64 }),
        method: 'POST'
    });

    if (!response.ok) { walletBalansDiv.textContent = "Bedrag niet te bereiken.. netwerk probleem... herlaad.." };
    const result = await response.json();

    if (result.success == false) location.reload();

    if (result.success != false) {
        walletBalansDiv.textContent = `${result.amount} coins`;
    } else {
        alert("User bestaat niet; waarschijnlijk een server-side wijziging. Pagina wordt automatisch herladen.");
        location.reload();
        return;
    }

    const submitBtn = document.querySelector('#submit-input');
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const selectedUserPrivateKeyBase64 = div.querySelector("#privateKey").value; //verzender zijn private key
        const amount = parseInt(div.querySelector('#amount').value);

        if (isNaN(amount)) {
            alert("Ongeldig bedrag.");
            closeTransactiepopUp(blurDiv, div);
            return;
        }

        const recipientPublicKeyBase64 = div.querySelector("#recipientPublicKey").value; //ontvanger zijn public key

        try {
            //body => base64 format!!!!
            const response = await fetch(`${currentDomain}/transaction/create-and-broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderPublicKeyBase64: selectedUserPublicKeybase64, senderPrivateKeyBase64: selectedUserPrivateKeyBase64, recipientPublicKeyBase64, amount })
            });

            const result = await response.json();
            alert(result.msg);
            if (result.success) closeTransactiepopUp(blurDiv, div);
        } catch (error) {
            console.log(error);
            alert("Transactie error.");
        };
    });
});

// *explore:
blockExplorerBtn.addEventListener("click", () => {
    window.open(`${currentDomain}/explore/blockchain`, '_blank');
});
showAddressDataBtn.addEventListener('click', () => {
    selectedUser = userSelect.value; //pub key vd geselecteerde user
    postToNewTab(`http://localhost:${port}/explore/address-data`, { publicKey: selectedUser }); //{base64}
});

//functions
function postToNewTab(url, data) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank';

    for (const key in data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data[key];
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};
function makeTransactiePopUp(blurDiv, div, context) {
    blurDiv.classList.add("blurr");
    div.innerHTML = context;
    div.classList.add('transactie-card');
    document.body.appendChild(blurDiv)
    document.body.appendChild(div);
};
function closeTransactiepopUp(blurDiv, div) {
    blurDiv.remove()
    div.remove()
};