# `governor-cli`

This is a command line tool for running actions on governance smart contracts and related contracts in order to carry out tests while developing.
For development we usually deploy the set of governance/polling contracts to a blockchain. 
To be able to use `governor-cli` properly, use the optional configurations in `.env` file to provider one or multiple proposer and voter private keys. Also, take care of all network configurations in `.env` (see [here](./configurations.md)).

During the development, `governor-cli` is run using `ts-node`

Example command line that prints out settings on the contract named `PollingAccept1` in `deploys/coston.json`.
```bash
yarn ts-node src/scripts/governor-cli.ts -n coston -a settings -c PollingAccept1
```

We can also compile Typescript by running `yarn build` and then run `governor-cli` by 
```bash
node dist/src/scripts/governor-cli.ts -n coston -a settings -c PollingAccept1
```

There is an equivalent shortcut in `package.json` using `ts-node`, which has preset parameter for the `coston` network. The equivalent call can be done as follows.

```bash
yarn governor-cli -a settings -c PollingAccept1
```

## Examples

- Create a proposal as proposer `0` (corresponding to the private key `PROPOSER_PK_0` in `.env`)
```bash
yarn governor-cli -a propose -i 0 -d "Some description" -c PollingAccept1
````
If proposal is submitted, the call prints out the proposal id. This one can be used for other calls. For further examples, assume that proposal id is `0x2441657af5d246c1e40e8199590c02e3904e93aeda61d2c35a6b0f4068dedb91`

- Cast a vote to the proposal as the voter `0` (corresponding to the private key `VOTER_PK_0` in `.env`) with the vote `0` (`0` - against, `1` - for, `2` - abstain) to the contract with name `PollingAccept1` in `deploys/coston.json`.
```bash
yarn governor-cli -a castVote -i 0 -p 0x2441657af5d246c1e40e8199590c02e3904e93aeda61d2c35a6b0f4068dedb91 -v 0 -c PollingAccept1
```

- Generate some account private keys and append them to `.env` file (generates `VOTER_PK_0` to `VOTER_PK_100`)

```bash
yarn governor-cli -a generateAccounts -s 0 -e 100 -f .env
```

- Check the account status (balances in FLR and WFLR) for all voter accounts in `.env`
```bash
yarn governor-cli -a accountStatus
```

- Fund all the voter accounts in `.env` from some account for which the private key is provided. The amount in example is `110` FLR (it can be provided in decimal form, like `1.1` FLR)
```bash
yarn governor-cli -a fund -t 110 -k 0x00000...<private-key>
````

- Wrap 100 FLR on all voter accounts from `.env`
```bash
yarn governor-cli -a wrapAll -t 100
````

- Cast random votes for all voter accounts in `.env` to the contract with name `PollingAccept1` in `deploys/coston.json`, for proposal id `0x2441657af5d246c1e40e8199590c02e3904e93aeda61d2c35a6b0f4068dedb91`.
```bash
yarn governor-cli -a castAllVotesRandomly -p 0x2441657af5d246c1e40e8199590c02e3904e93aeda61d2c35a6b0f4068dedb91 -c PollingAccept1
```

- Cast random votes for all voter accounts in `.env` to the contract with name `PollingAccept1` in `deploys/coston.json` for voters from indices 0 to 10, for proposal id `0x2441657af5d246c1e40e8199590c02e3904e93aeda61d2c35a6b0f4068dedb91`.
```bash
yarn governor-cli -a castAllVotesRandomly -p 0x2441657af5d246c1e40e8199590c02e3904e93aeda61d2c35a6b0f4068dedb91 -c PollingAccept1 -s 0 -e 10
```
