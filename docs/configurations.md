# Configurations

The main config files are:
- `deploys/<network-name>.json` - deployment configurations with addresses and names of contracts to be used. This includes contracts `wNat`, `GovernanceVotePowers` and all instances of contracts `PollingAccept` and `PollingReject`. Different instances of contracts should have different names (like `PollingAccept1`).
- `artifacts` folder - artifacts copied from the `artifacts` folder when [`flare-smart-contracts`](https://gitlab.com/flarenetwork/flare-smart-contracts) repo is compiled. They should contain artifact files of relevant contracts mentioned above, which contain ABIs. Artifacts can be obtained from the repo by syncing (see below).
- `.env` - environment variable configuration file.

## `.env` file

- Web server:
   - `WEB_SERVER_PORT` - the port on which the web server runs (for development we use `9500`)
- Database
   - `DB_TYPE` - database type (usually `mysql`)
   - `DB_HOST` - database host (usually `localhost`)
   - `DB_PORT` - database port (usually `3306`)
   - `DB_DATABASE` - database name (for development we use `govbackdb`)
   - `DB_USERNAME` - database user name (for development we use (`govbackuser`)
   - `DB_PASSWORD` - database user pasword (for development we use `t$.passW.O:RD5`)
- Blockchain
   - `NETWORK` - name of the network. It should match the file name for address configuration `deploys/<NETWORK>.json`
   - `RPC` - RPC api name for the network
   - `MAX_BLOCKS_FOR_EVENT_READS` - how many blocks can be read with single web3 API call (like `getAllEvents`)
   - `INDEXING_START_BLOCK` - starting block for reading events if the database is clean.
   
In addition, there are optional configuration setting, that **should not be used in production**. They are used as a configuration for `governor-cli` tool.

- `PROPOSER_PK_<index>` - where `<index>` is a number. There can be several sequential such variables with different numbers but in sequence from 0 on. They contain `0x`-prefixed private keys of whitelisted proposers of the `PollingReject` contracts.
- `VOTER_PK_<number>` - where `<index>` is a number. There can be several sequential such variables with different numbers but in sequence from 0 on. They contain `0x`-prefixed private keys of voters. Voters should have some funds.

## Syncing artifacts

Clone the `flare-smart-contracts` repo into the same parent folder as this repo. Set the relevant branch on the `flare-smart-contracts` 
repo and compile the contracts. Then run:

```
yarn artifacts
```

This will sync the `artifacts` folder for the contract with names defined in the `contractToSync` list in [`src/utils/sync-artifacts.ts`](src/utils/sync-artifacts.ts) and run Typechain type file generation (generates the folder `typechain-web3-v1`). 

