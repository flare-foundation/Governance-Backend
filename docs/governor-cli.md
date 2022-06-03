# `governor-cli`

This is a command line tool for running actions on governance smart contracts and related contracts in order to carry out tests.


Example command line:
```bash
yarn ts-node src/test-scripts/governor-cli.ts -n coston -a settings
```

There is an equivalent shortcut in `package.json` which has preset parameter for the coston network. Note that you have to have the following environment variables set in `.env` file:
- `RPC` - rpc link to a network node. It has to support 
- `MAX_BLOCKS_FOR_EVENT_READS` - from how many blocks can `getPastEvents` function in a web3.js contract read in one call.
- `PROPOSER_PK_<index>` - where `<index>` is a number. There can be several sequential such variables with different numbers but in sequence from 0 on. They contain `0x`-prefixed private keys of whitelisted proposers of the `PollingReject` contracts.
- `VOTER_PK_<number>` - where `<index>` is a number. There can be several sequential such variables with different numbers but in sequence from 0 on. They contain `0x`-prefixed private keys of voters. Voters should have some funds.



```bash
yarn governor-cli -a settings
```


// 
// Examples:
// yarn governor-cli -a propose -i 0 -d "Test proposal CLI9"
// yarn governor-cli -a castVote -i 0 -p 0x2441657af5d246c1e40e8199590c02e3904e93aeda61d2c35a6b0f4068dedb91 -v 0
// yarn governor-cli -a generateAccounts -s 0 -e 100 -f .env
// yarn governor-cli -a accountStatus
// yarn governor-cli -a fund -t 110 -k 0x00000...<private-key>
// yarn governor-cli -a wrapAll -t 100
// yarn governor-cli -a castAllVotesRandomly -p 0x153046e7c19228e570d0811555cb2bf11a38a2c39010af27a7626cba2505f4df
// PollingAccept1 demo:
// yarn governor-cli -a propose -i 0 -d "Test proposal CLI9 PollingAccept2" -c PollingAccept1
// yarn governor-cli -a castAllVotesRandomly -p 0x303e298de4adfe883bb3ff078da0c1057bc5c7565a47e56df15f35678cf8eae6 -c PollingAccept1

// yarn governor-cli -a propose -i 0 -d "Test proposal CLI3 PollingAccept1" -c PollingAccept1
// yarn governor-cli -a propose -i 0 -d "Test proposal CLI3 PollingAccept" -c PollingAccept
// yarn governor-cli -a propose -i 0 -d "Test proposal CLI3 PollingReject" -c PollingReject
// yarn governor-cli -a castAllVotesRandomly -p 0x421a39dab9a03f8c199868ed78117ef0eb956098a5ccab1f8d32d6f492cb9134 -c PollingAccept1
// yarn governor-cli -a castAllVotesRandomly -p 0xed20f5db7c22982ecba4697d5762797886c4dc76da952aa61f6ba3fd9f5accb7 -c PollingAccept
// yarn governor-cli -a castAllVotesRandomly -p 0x91b099bbdb9dda0ba43f3514129a6c1eaa86a0e3f1f8cbe4cc8069368c083cf5 -c PollingReject

// yarn governor-cli -a propose -i 0 -d "New PollingAccept1 - 8" -c PollingAccept1
// yarn governor-cli -a castAllVotesRandomly -p 0xfbb31e4c919b36d5b40c36dd54408d8fe93afc59635903a052114857bffc216a -c PollingAccept1 -s 0 -e 10
// yarn governor-cli -a settings -c PollingAccept1
