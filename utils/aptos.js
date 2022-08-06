const aptos = require("aptos");
const logger = require("./logger");
const { AptosAccount } = require("aptos");
const { network } = require("./config");

const NODE_URL =
  network.full_node ||
  process.env.APTOS_NODE_URL ||
  "https://fullnode.devnet.aptoslabs.com";
const FAUCET_URL =
  network.faucet ||
  process.env.APTOS_FAUCET_URL ||
  "https://faucet.devnet.aptoslabs.com";
const client = new aptos.AptosClient(NODE_URL);
const faucetClient = new aptos.FaucetClient(NODE_URL, FAUCET_URL, null);

logger.title(" CURRENT NETWORK ");

console.log({
  NODE_URL,
  FAUCET_URL,
});

async function createAccount(amount = 5000) {
  const account = new aptos.AptosAccount();
  await fundAccount(account.address(), amount);
  return account;
}

async function fundAccount(address, amount) {
  await faucetClient.fundAccount(address, amount);
}

async function queryBalance(address) {
  const resources = await client.getAccountResources(address);
  const accountResource = resources.find(
    (r) => r.type === `${network.coin_store}<${network.coin_type}>`
  );
  return accountResource.data.coin.value;
}

function recoveryAccount(address, publicKeyHex, privateKeyHex) {
  return AptosAccount.fromAptosAccountObject({
    address,
    publicKeyHex,
    privateKeyHex,
  });
}

async function __waitForTransaction(client, txnHash, timeout) {
  let count = 0;
  while (await client.transactionPending(txnHash)) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    count += 1000;
    if (count >= timeout) {
      throw new Error(`Waiting for transaction ${txnHash} timed out!`);
    }
  }
}

async function transfer(account, dest_address, amount) {
  const payload = {
    type: "script_function_payload",
    function: network.transfer_script,
    type_arguments: [network.coin_type],
    arguments: [dest_address, "" + amount],
  };
  console.log(payload)
  const txnRequest = await client
    .generateTransaction(account.address(), payload)
    .catch((e) => {
      throw new Error(`Step.1: ${e.message}`);
    });
  const signedTxn = await client
    .signTransaction(account, txnRequest)
    .catch((e) => {
      throw new Error(`Step.2: ${e.message}`);
    });
  const transactionRes = await client
    .submitTransaction(signedTxn)
    .catch((e) => {
      throw new Error(`Step.3: ${e.message}`);
    });
  await __waitForTransaction(client, transactionRes.hash, 60_000).catch((e) => {
    throw new Error(`Step.4: ${e.message}`);
  });
  // await client.waitForTransaction(transactionRes.hash).catch((e) => {
  //   throw new Error(`Step.4: ${e.message}`);
  // });
}

Object.assign(exports, {
  createAccount,
  fundAccount,
  queryBalance,
  recoveryAccount,
  transfer,
});
