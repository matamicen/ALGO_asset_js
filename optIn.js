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

// El que hace optIn es el Creador de Votacion

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

let suggestedParams = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        // suggestedParams.fee = 1000;
        // suggestedParams.flatFee = true;

// signing and sending "txn" allows sender to begin accepting asset specified by creator and index
let opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget,
        amount, note, assetID, suggestedParams);
// Must be signed by the account wishing to opt in to the asset    
rawSignedTxn = opttxn.signTxn(senderPrivateKey.sk);
let opttx = (await algodClient.sendRawTransaction(rawSignedTxn).do());
console.log("Transaction : " + opttx.txId);
// wait for transaction to be confirmed
await waitForConfirmation(algodClient, opttx.txId, 4);
//You should now see the new asset listed in the account information
console.log("Account 3 = " + sender);
await printAssetHolding(algodClient, sender, assetID);


}

main().catch(console.error);