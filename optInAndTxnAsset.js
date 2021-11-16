// Example: creating an asset

// const algosdk = require('..');
const algosdk = require('algosdk');
// const utils = require('./utils');

// const { SENDER } = utils.retrieveBaseConfig();

const keypress = async () => {
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
    })) 
}

const waitForConfirmation = async function (algodClient, txId, timeout) {
    if (algodClient == null || txId == null || timeout < 0) {
        throw new Error("Bad arguments");
    }

    const status = (await algodClient.status().do());
    if (status === undefined) {
        throw new Error("Unable to get node status");
    }

    const startround = status["last-round"] + 1;
    let currentround = startround;

    while (currentround < (startround + timeout)) {
        const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
        if (pendingInfo !== undefined) {
            if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
                //Got the completed Transaction
                return pendingInfo;
            } else {
                if (pendingInfo["pool-error"] != null && pendingInfo["pool-error"].length > 0) {
                    // If there was a pool error, then the transaction has been rejected!
                    throw new Error("Transaction " + txId + " rejected - pool error: " + pendingInfo["pool-error"]);
                }
            }
        }
        await algodClient.statusAfterBlock(currentround).do();
        currentround++;
    }
    throw new Error("Transaction " + txId + " not confirmed after " + timeout + " rounds!");
};

const printAssetHolding = async function (algodClient, account, assetid) {
    // note: if you have an indexer instance available it is easier to just use this
    //     let accountInfo = await indexerClient.searchAccounts()
    //    .assetID(assetIndex).do();
    // and in the loop below use this to extract the asset for a particular account
    // accountInfo['accounts'][idx][account]);
    let accountInfo = await algodClient.accountInformation(account).do();
    for (idx = 0; idx < accountInfo['assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['assets'][idx];
        if (scrutinizedAsset['asset-id'] == assetid) {
            let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
            console.log("assetholdinginfo = " + myassetholding);
            break;
        }
    }
};


async function main() {

    // Opting in to transact with the new asset
// Allow accounts that want recieve the new asset
// Have to opt in. To do this they send an asset transfer
// of the new asset to themseleves 
// In this example we are setting up the 3rd recovered account to 
// receive the new asset


        // Connect your client
        // const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        // const algodServer = 'http://localhost';
        // const algodPort = 4001;
        const algodToken = '';
        const algodServer = "https://api.testnet.algoexplorer.io";
        const algodPort = '';

        let algodClient = new algosdk.Algodv2(algodToken, algodServer,algodPort);  

// Este usuario es el que va a ser OptIn, el que creo la votacion
sendermnemonic = "fortune tumble shoot material solve face visit size fatal public pulp size bomb brisk jacket junior dad rack pitch quality vapor pioneer sea abstract bullet"
let sender = "MEBVPYXHXJIS2RBGIL62HM4ARR5B4U46HJ6KS2T3ACWPVSZEE4NOLI6CJM";
let senderPrivateKey = algosdk.mnemonicToSecretKey(sendermnemonic)
let recipient = sender;
// We set revocationTarget to undefined as 
// This is not a clawback operation
let revocationTarget = undefined;
// CloseReaminerTo is set to undefined as
// we are not closing out an asset
let closeRemainderTo = undefined;
// We are sending 0 assets
amount = 0;
const assetID = 45284468;
note = undefined;


// el que envia el asset es el creador del asset Matito que aca seria el sender2
sendermnemonic2 = "method symptom spare holiday kangaroo fuel parrot because disease famous normal grid people path pioneer dose peasant report rebuild purse cute orphan coyote ability square";
let sender2 = "Z5G47TZ223WOLLGJJ5G6I4HVO5QFW6KZKODUMCHDPP2IFDONMS3KGEUBOQ";
let senderPrivateKey2 = algosdk.mnemonicToSecretKey(sendermnemonic2);
// el usuario que recibe el asset es el que hizo el OptIn (el que esta definido arriba)
let recipient2 = "MEBVPYXHXJIS2RBGIL62HM4ARR5B4U46HJ6KS2T3ACWPVSZEE4NOLI6CJM"; // recibe el que creo la votacion
// We set revocationTarget to undefined as 
// This is not a clawback operation
// let revocationTarget = undefined;
// CloseReaminerTo is set to undefined as
// we are not closing out an asset
// let closeRemainderTo = undefined;



let suggestedParams = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        // suggestedParams.fee = 1000;
        // suggestedParams.flatFee = true;

// signing and sending "txn" allows sender to begin accepting asset specified by creator and index
// esta TXN hace el optIn
let opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget,
        amount, note, assetID, suggestedParams);




amount = 10;
// esta Txn trasnfiere 10 matitos a el que Vota.
let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender2, recipient2, closeRemainderTo, revocationTarget,
    amount, note, assetID, suggestedParams);


// ya tenemos las dos Txn definidas, vamos a atomizarlas
  // assign group id to transactions
  algosdk.assignGroupID([opttxn, xtxn]);


// Must be signed by the account wishing to opt in to the asset    
stxn1 = opttxn.signTxn(senderPrivateKey.sk);
// Must be signed by the account sending the asset  
stxn2 = xtxn.signTxn(senderPrivateKey2.sk)

 // send transactions (note that the accounts need to be funded for this to work)
 console.log('Sending transactions...');
 const { txId } = await algodClient.sendRawTransaction([stxn1, stxn2]).do();


// let opttx = (await algodClient.sendRawTransaction(rawSignedTxn).do());
// console.log("Transaction : " + opttx.txId);
// // wait for transaction to be confirmed
await waitForConfirmation(algodClient, txId, 4);
// //You should now see the new asset listed in the account information
// console.log("Account 3 = " + sender);
await printAssetHolding(algodClient, sender, assetID);


}

main().catch(console.error);