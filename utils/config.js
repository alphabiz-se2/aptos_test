const aws_test_net_1 = {
  name: "aws_test_net_1",
  full_node: "http://34.200.120.251:8080",
  faucet: "http://34.200.120.251:8000",
  coin_type: "0x1::TestCoin::TestCoin",
  coin_store: "0x1::Coin::CoinStore",
  transfer_script: "0x1::Coin::transfer",
};

const local_test_net_1 = {
  name: "local_test_net_1",
  full_node: "http://localhost:8080",
  faucet: "http://localhost:8000",
  coin_type: "0x1::TestCoin::TestCoin",
  coin_store: "0x1::Coin::CoinStore",
  transfer_script: "0x1::Coin::transfer",
};

const dev_net = {
  name: "dev_net",
  full_node: "https://fullnode.devnet.aptoslabs.com",
  faucet: "https://faucet.devnet.aptoslabs.com",
  coin_type: "0x1::aptos_coin::AptosCoin",
  coin_store: "0x1::coin::CoinStore",
  transfer_script: "0x1::coin::transfer",
};

exports.network = local_test_net_1;
