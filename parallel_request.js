const db_account = require("./utils/db_account");
const aptos = require("./utils/aptos");
const logger = require("./utils/logger");
const moment = require("moment");
const ensure_account = require("./scripts/ensure_account");
const ensure_balance = require("./scripts/ensure_balance");

main(1);

async function main(request_num) {
  const account_num = request_num * 2;
  await ensure_account(account_num);
  await ensure_balance(200, account_num);
  logger.line("Parallel Request:");
  logger.line("- request_num", request_num);
  logger.line("- account_num", account_num);
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
    const amount = 100;
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
  logger.line("requests start");
  const startTime = new Date();
  await Promise.all(requests.map((request) => request()));
  const endTime = new Date();
  logger.line("requests done");

  logger.title(" Result ");
  const formatTime = (x) => moment.utc(x).format("HH:mm:ss:SSS");
  const delta = formatTime(endTime.getTime() - startTime.getTime());
  logger.line("Request Num:", request_num);
  logger.line("Duration:", delta);
  logger.line("Succeed:", succeed, "Failed:", failed);
}
