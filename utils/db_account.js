const db = require("./db");
const aptos = require("./aptos");
const logger = require("./logger");
const { AptosAccount } = require("aptos");
const { ParallelQueue } = require("./utils");
const moment = require("moment");
const { network } = require("./config");

const createAccount = async ({ name, balance }) => {
  await db.ensureConnected;
  try {
    // logger.asyncFn("createAccount", "wait", network, balance);
    balance = balance || 5000;
    const account = await aptos.createAccount(balance);
    const { address, publicKeyHex, privateKeyHex } =
      account.toPrivateKeyObject();
    const res = await db.account.create({
      data: {
        address: address,
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
        balance: balance,
        network: network.name,
        name: name || address.substring(2, 10),
      },
    });
    // logger.asyncFn("createAccount", "done", res.name);
  } catch (e) {
    logger.asyncFn("createAccount", "failed", e.message);
  }
};

const queryAccountCount = async () => {
  await db.ensureConnected;
  return await db.account.count({
    where: { network: network.name },
  });
};

const queryAccountAddressList = async (count = undefined) => {
  await db.ensureConnected;
  const res = await db.account.findMany({
    where: {
      network: network.name,
    },
    take: count,
    select: {
      address: true,
    },
  });
  return res.map((i) => i.address);
};

const queryAccount = async (address) => {
  await db.ensureConnected;
  return await db.account.findUnique({
    where: { address },
  });
};

const queryAccounts = async (addressList) => {
  return await db.account.findMany({
    where: {
      address: { in: addressList },
    },
  });
};

const prepareAptosAccounts = async (ensure_count, parallel_num = 50) => {
  const addressList = await queryAccountAddressList();
  logger.line("Account Count:", addressList.length);

  if (ensure_count <= addressList.length) return;

  const sum = ensure_count - addressList.length;
  const startTime = new Date();
  let bundleStartTime;
  const arr = Array.from({ length: sum }, (_, i) => i);
  let done = 0;
  const parallelExecutor = ParallelQueue(parallel_num);

  parallelExecutor.setCallback("bundle_start", (delta) => {
    bundleStartTime = new Date();
    logger.asyncFn(
      "createAccount::start",
      Math.round(((done + delta) / sum) * 10000) / 100 + "%",
      `${done + delta} / ${sum}`
    );
  });
  parallelExecutor.setCallback("bundle_end", async (delta) => {
    const time = new Date();
    done += delta;

    const used = time.getTime() - startTime.getTime();
    const used_bundle = time.getTime() - bundleStartTime.getTime();
    const estimated = (used / done) * (sum - done);
    const formatTime = (x) => moment.utc(x).format("HH:mm:ss");
    logger.asyncFn(
      "createAccount::end",
      Math.round((done / sum) * 10000) / 100 + "%",
      `${done} / ${sum}`,
      ...["Total duration:", formatTime(used), "\t"],
      ...["Bundle duration:", formatTime(used_bundle), "\t"],
      ...["Estimated:", formatTime(estimated)]
    );
    // await new Promise((resolve) => setTimeout(resolve, 100));
  });
  const createPromise = (i) => {
    return parallelExecutor.execute(async () => {
      await createAccount({
        network: network.name,
        balance: 5000,
      });
    });
  };
  await Promise.all(arr.map(createPromise));
  parallelExecutor.stop();
};

Object.assign(exports, {
  createAccount,
  queryAccount,
  queryAccounts,
  queryAccountCount,
  queryAccountAddressList,
  prepareAptosAccounts,
});
