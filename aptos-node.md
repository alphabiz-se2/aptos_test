
Additional information:
* If you use this compose for different Aptos Networks, you will need remove the db volume first.
* If you would like to use the current Aptos version within this repository, execute the
    `build.sh` in `docker/validator` and change the image tag below to aptos_e2e:latest
* Validator images can be found at https://hub.docker.com/repository/docker/aptoslabs/validator/tags
* Faucet images can be found at https://hub.docker.com/repository/docker/aptoslabs/faucet/tags

Monitoring:
If you want to install the monitoring components for your validator-testnet
you can symlink the ../monitoring folder into this directory.
Note that you will need to rename the monitoring docker-compose.yaml file to avoid duplication.
e.g. rename it to docker-compose.mon.yaml
You will also need to configure the network in the monitoring compose file,
so that the container can join the same network and talk to each other.
To start both validator and monitoring, run `docker-compose -f docker-compose.yaml -f docker-compose.mon.yaml up -d`

