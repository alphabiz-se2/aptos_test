const db_account = require("../utils/db_account");
const logger = require("../utils/logger");
const aptos = require("../utils/aptos");
const { ParallelQueue, parallelRequests } = require("../utils/utils");
const moment = require("moment");
const { network } = require("../utils/config");
const ensure_account = require("./ensure_account");
const ensure_balance = require("./ensure_balance");

main(500);
async function main(request_num) {
  const account_num = request_num * 2;
  const transfer_amount = 100;
  await ensure_account(account_num);
  await ensure_balance(transfer_amount, account_num);
  logger.line("Parallel Request:");
  logger.line("- request_script", '0x1::account::transfer');
  logger.line("- request_num", request_num);
  logger.line("- account_num", account_num);
  logger.line("- transfer_amount", transfer_amount);
  console.log("\n");
  logger.line("Loading account addresses...");
  const addressList = await db_account.queryAccountAddressList(account_num);

  logger.line("Loading accounts...");
  const accountList = await db_account.queryAccounts(addressList);
  accountList.forEach((account) => {
    Object.assign(account, {
      aptos: aptos.recoveryAccount(
          account.address,
          account.publicKey,
          account.privateKey
      ),
    });
  });

  logger.line("Loading requests...");
  let succeed = 0;
  let failed = 0;
  const requests = Array.from({ length: request_num }, (_, i) => {
    const a = accountList[i * 2];
    const b = accountList[i * 2 + 1];
    const dirStr = [a.name, b.name].map((x) => x.padEnd(6)).join(" => ");
    const cursorStr = `[${i.toString().padStart(5, "0")}]`;
    const amount = transfer_amount;
    return async () => {
      try {
        await aptos.transfer(a.aptos, b.address, amount);
        succeed += 1;
      } catch (e) {
        failed += 1;
        logger.asyncFn("transfer", "failed", cursorStr, dirStr, e.message);
      }
    };
  });


  logger.title(" Transfer ");
  logger.line("requests start, waiting...");
  const startTime = new Date();
  await Promise.all(requests.map((request) => request()));
  const endTime = new Date();
  logger.line("requests done");

  logger.title(" Result ");
  const formatTime = (x) => moment.utc(x).format("HH:mm:ss:SSS");
  const delta = endTime.getTime() - startTime.getTime();
  logger.line("Request Num:", request_num);
  logger.line("Duration:", formatTime(delta), "Succeed:", succeed, "Failed:", failed);
  logger.line('TPS:', Math.round((succeed * 1000 / delta) * 10000) / 100)
}

exports = main;
