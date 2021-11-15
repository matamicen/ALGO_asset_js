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


        // Connect your client
        // const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        // const algodServer = 'http://localhost';
        // const algodPort = 4001;
        const algodToken = '';
        const algodServer = "https://api.testnet.algoexplorer.io";
        const algodPort = '';

        let algodClient = new algosdk.Algodv2(algodToken, algodServer,algodPort);    



    await printAssetHolding(algodClient, "Z5G47TZ223WOLLGJJ5G6I4HVO5QFW6KZKODUMCHDPP2IFDONMS3KGEUBOQ", 45284468);

// el Sender es el creador del Asset

sendermnemonic = "method symptom spare holiday kangaroo fuel parrot because disease famous normal grid people path pioneer dose peasant report rebuild purse cute orphan coyote ability square";
let sender = "Z5G47TZ223WOLLGJJ5G6I4HVO5QFW6KZKODUMCHDPP2IFDONMS3KGEUBOQ";
let senderPrivateKey = algosdk.mnemonicToSecretKey(sendermnemonic);
let recipient = "MEBVPYXHXJIS2RBGIL62HM4ARR5B4U46HJ6KS2T3ACWPVSZEE4NOLI6CJM"; // recibe el que creo la votacion
// We set revocationTarget to undefined as 
// This is not a clawback operation
let revocationTarget = undefined;
// CloseReaminerTo is set to undefined as
// we are not closing out an asset
let closeRemainderTo = undefined;



// Transfer New Asset:
// Now that account3 can recieve the new tokens 
// we can tranfer tokens in from the creator
// to account3
// sender = recoveredAccount1.addr;
// recipient = recipientAsset;
revocationTarget = undefined;
closeRemainderTo = undefined;
//Amount of the asset to transfer
amount = 10;
// assetID = '45284468'; // matitos
// var assetID = parseInt('45284468');
// var assetID = new Uint8Array(1);
assetID = 45284468;

note = undefined;

let suggestedParams = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        suggestedParams.fee = 1000;
        suggestedParams.flatFee = true;

// signing and sending "txn" will send "amount" assets from "sender" to "recipient"
assetID = 45284468;
let xtxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget,
        amount, note, assetID, suggestedParams);
// Must be signed by the account sending the asset  
rawSignedTxn = xtxn.signTxn(senderPrivateKey.sk)
let xtx = (await algodClient.sendRawTransaction(rawSignedTxn).do());
console.log("Transaction : " + xtx.txId);
// wait for transaction to be confirmed
await waitForConfirmation(algodClient, xtx.txId, 4);

// You should now see the 10 assets listed in the account information
console.log("Account 3 = " + recipient);
await printAssetHolding(algodClient, recipient, assetID);

}

main().catch(console.error);