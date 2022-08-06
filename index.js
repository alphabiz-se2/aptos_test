
let argv = require('minimist')(process.argv.slice(2));

console.log(argv);

const action = argv.action

const mappers = {
  ensure_account: () => {
    require('./scripts/ensure_account')(argv.account_num, argv.initial_balance)
  },
  ensure_balance: () => {
    require('./scripts/ensure_balance')(argv.balance, argv.account_num)
  }
}

if (!mappers[action]) {
  console.log('action not found')
} else {
  mappers[action]()
}
