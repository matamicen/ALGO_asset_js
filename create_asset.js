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

const printCreatedAsset = async function (algodClient, account, assetid) {
    // note: if you have an indexer instance available it is easier to just use this
    //     let accountInfo = await indexerClient.searchAccounts()
    //    .assetID(assetIndex).do();
    // and in the loop below use this to extract the asset for a particular account
    // accountInfo['accounts'][idx][account]);
    let accountInfo = await algodClient.accountInformation(account).do();
    for (idx = 0; idx < accountInfo['created-assets'].length; idx++) {
        let scrutinizedAsset = accountInfo['created-assets'][idx];
        if (scrutinizedAsset['index'] == assetid) {
            console.log("AssetID = " + scrutinizedAsset['index']);
            let myparms = JSON.stringify(scrutinizedAsset['params'], undefined, 2);
            console.log("parms = " + myparms);
            break;
        }
    }
};

async function main() {
//   const sender = algosdk.mnemonicToSecretKey(SENDER.mnemonic);

        // Connect your client
        // const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        // const algodServer = 'http://localhost';
        // const algodPort = 4001;
        const algodToken = '';
        const algodServer = "https://api.testnet.algoexplorer.io";
        const algodPort = '';

        let algodClient = new algosdk.Algodv2(algodToken, algodServer,algodPort);     

try {

const sender = algosdk.generateAccount();
// console.log('creator address:')
// console.log(sender.addr)
console.log('creator address:'+sender.addr)
console.log('creatorMnemonic:'+ algosdk.secretKeyToMnemonic(sender.sk))

await keypress();

//Check your balance
let accountInfo = await algodClient.accountInformation(sender.addr).do();
console.log("Account balance: %d microAlgos", accountInfo.amount);
let startingAmount = accountInfo.amount;




  // generate accounts
//   const { addr: freezeAddr, mnemonic: freezeMnemonic } = algosdk.generateAccount(); // account that can freeze other accounts for this asset
 freeze = algosdk.generateAccount(); // account that can freeze other accounts for this asset  
console.log('freezeAddr address:'+freeze.addr)
console.log('freezeMnemonic:'+ algosdk.secretKeyToMnemonic(freeze.sk))
//   console.log('freezeMnemonic:'+freeze.addr)
  managerAddr = algosdk.generateAccount(); // account able to update asset configuration  
  console.log('managerAddr address:'+managerAddr.addr)
  console.log('managerAddr Mnemonic:'+ algosdk.secretKeyToMnemonic(managerAddr.sk))
//   const { addr: clawbackAddr } = algosdk.generateAccount(); // account allowed to take this asset from any other account
//   console.log('clawbackAddr address:')
//   console.log(clawbackAddr)
clawbackAddr = algosdk.generateAccount(); // account able to update asset configuration  
console.log('clawbackAddr address:'+clawbackAddr.addr)
console.log('clawbackAddr Mnemonic:'+ algosdk.secretKeyToMnemonic(clawbackAddr.sk))
//   const { addr: reserveAddr } = algosdk.generateAccount(); // account that holds reserves for this asset
//   console.log('reserveAddr address:')
//   console.log(reserveAddr)
reserveAddr = algosdk.generateAccount(); // account able to update asset configuration  
console.log('reserveAddr address:'+reserveAddr.addr)
console.log('reserveAddr Mnemonic:'+ algosdk.secretKeyToMnemonic(reserveAddr.sk))

  const feePerByte = 10;
  const firstValidRound = 1000;
  const lastValidRound = 2000;
  const genesisHash = 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=';

  const total = 100; // how many of this asset there will be
  const decimals = 0; // units of this asset are whole-integer amounts
  const assetName = 'Matitos';
  const unitName = 'mats';
  const url = 'mats.com';
  const metadata = new Uint8Array(
    Buffer.from(
      '664143504f346e52674f35356a316e64414b3357365367633441506b63794668',
      'hex'
    )
  ); // should be a 32-byte hash
  const defaultFrozen = false; // whether accounts should be frozen by default

  // create suggested parameters
  // in most cases, we suggest fetching recommended transaction parameters
  // using the `algosdk.Algodv2.getTransactionParams()` method
//   const suggestedParams = {
//     flatFee: false,
//     fee: feePerByte,
//     firstRound: firstValidRound,
//     lastRound: lastValidRound,
//     genesisHash,
//   };

        let suggestedParams = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        suggestedParams.fee = 1000;
        suggestedParams.flatFee = true;

  // create the asset creation transaction
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    total,
    decimals,
    assetName,
    unitName,
    assetURL: url,
    assetMetadataHash: metadata,
    defaultFrozen,

    // freeze: freezeAddr,
    freeze: freeze.addr,
    manager: managerAddr.addr,
    clawback: clawbackAddr.addr,
    reserve: reserveAddr.addr,

    suggestedParams,
  });

  // sign the transaction
  const signedTxn = txn.signTxn(sender.sk);

  // print transaction data
  const decoded = algosdk.decodeSignedTransaction(signedTxn);
  console.log(decoded);


        // Sign the transaction
        // let signedTxn = txn.signTxn(myAccount.sk);
        let txId = txn.txID().toString();
        console.log("Signed transaction with txID: %s", txId);

        // Submit the transaction
        await algodClient.sendRawTransaction(signedTxn).do();

        // Wait for confirmation
        let confirmedTxn = await waitForConfirmation(algodClient, txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        var string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
        console.log("Note field: ", string);
        accountInfo = await algodClient.accountInformation(sender.addr).do();
        console.log("Transaction Amount: %d microAlgos", confirmedTxn.txn.txn.amt);        
        console.log("Transaction Fee: %d microAlgos", confirmedTxn.txn.txn.fee);
        let closeoutamt = startingAmount - confirmedTxn.txn.txn.amt - confirmedTxn.txn.txn.fee;     
        console.log("Close To Amount: %d microAlgos", closeoutamt);
        console.log("Account balance: %d microAlgos", accountInfo.amount);
    }
    catch (err) {
        console.log("err", err);
    }
}

main().catch(console.error);