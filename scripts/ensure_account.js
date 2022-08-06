const db_account = require("../utils/db_account");
const logger = require("../utils/logger");
const { parallelRequests, ParallelQueue } = require("../utils/utils");
const { network } = require("../utils/config");

// main(21000, 5000);
async function main(account_num, initial_balance) {
  logger.line("Ensure Account:");
  logger.line("- account_num", account_num);
  logger.line("- initial_balance", initial_balance);
  console.log("\n");
  const current_account_num = await db_account.queryAccountCount(account_num);
  logger.line("Current Account Count:", current_account_num);
  if (current_account_num >= account_num) return;

  logger.title(" Start Parallel ");
  await parallelRequests(
    async (i) => {
      await db_account.createAccount({
        network: network.name,
        balance: initial_balance,
      });
    },
    {
      name: "create_account",
      parallel_num: 50,
      request_num: account_num - current_account_num,
    }
  );
}

module.exports = main;
