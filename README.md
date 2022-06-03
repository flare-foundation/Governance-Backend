# Governance backend

This is the Node.js backend server for the governance dapp.

## Architecture

The project is using the library [TSOA](https://tsoa-community.github.io/docs/), a Typescript upgrade of express server that includes support for dependency injection. 
It also includes TypeORM.

## Getting started 

1. Set up the database (see **Database configuration** below).
2. Configure the `.env` file. Use `.env.template`. Check `governor-cli` [docs](./docs/governor-cli.md)
3. 
```
yarn
yarn dev
```



## API documentation

- check `http://localhost:9500/api-doc/` for testing.



## Development process

If controllers or types are changed run 
```bash
yarn routes
```

If TypeORM entities are changed, run
```bash
yarn build
```

## Syncing artifacts

Clone the `flare-smart-contracts` repo into the same parent folder as this repo. Set the relevant branch on the `flare-smart-contracts` 
repo and compile the contracts. Then run:

```
yarn artifacts
```

This will sync the `artifacts` folder for the contract with names defined in the `contractToSync` list in [`src/utils/sync-artifacts.ts`](src/utils/sync-artifacts.ts) and run Typechain type file generation (generates the folder `typechain-web3-v1`). 

