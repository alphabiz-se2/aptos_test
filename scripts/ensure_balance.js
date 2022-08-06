const db_account = require("../utils/db_account");
const logger = require("../utils/logger");
const aptos = require("../utils/aptos");
const { ParallelQueue, parallelRequests } = require("../utils/utils");
const moment = require("moment");
const { network } = require("../utils/config");
const ensure_account = require("./ensure_account");

// main(5000, 10000);
async function main(balance, account_num) {
  await ensure_account(account_num, balance);
  logger.line("Ensure Balance:");
  logger.line("- balance", balance);
  logger.line("- account_num", account_num);
  console.log("\n");

  logger.line("Loading account addresses...");
  const addressList = await db_account.queryAccountAddressList(account_num);

  logger.title(" Start Parallel ");
  await parallelRequests(
    async (i) => {
      const num = await aptos.queryBalance(addressList[i]);
      if (num < balance) {
        await aptos.fundAccount(addressList[i], balance - num);
      }
    },
    {
      name: "ensure_balance",
      parallel_num: 50,
      request_num: addressList.length,
    }
  );
}

module.exports = main;
