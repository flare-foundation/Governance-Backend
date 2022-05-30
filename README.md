# Governance backend

This is the Node.js backend server for the governance dapp.

## Architecture

The project is using the library TSOA, a Typescript upgrade of express server that includes support for dependency injection. 
It also includes TypeORM.

## Getting started 

```
yarn
yarn dev
```

The project is based on [TSOA](https://tsoa-community.github.io/docs/). 


## API documentation

- check `http://localhost:9500/api-doc/` for testing.


#### Database configuration

Use MySQL Workbench. Connect to database as administrator. Right-click on empty space (bottom-left) below the listing of schemas. Choose `Create schema`.

- Schema name: `govbackdb`
- Character set: utf8mb4

Press `Apply` button.

Create user `govbackuser`. Choose `Users and Privileges`, add new user (username + password, by pressing `Add Account` button, fill in the username and twice password, press `Apply` button.

Set priviledges on user. Click on user, choose `Schema privileges` tab, press `Add entry` button, select under `Selected schema` the schema `govbackdb`, press `Ok`. Then press `Select all` button (privileges), and then press `Apply` button.    

## Creation of the database on a server

MySQL server version should be 8.0.0+.

```
sudo mysql
CREATE USER 'govbackuser'@'localhost' IDENTIFIED BY 't$.passW.O:RD5';
create database govbackdb
GRANT ALL PRIVILEGES ON govbackdb.* TO 'govbackuser'@'localhost';
FLUSH PRIVILEGES;
```

## Development process

If controllers or types are changed run 
```bash
yarn routes
```

If TypeORM entities are changed, run
```bash
yarn build
```

## Migrations

[Docs](https://typeorm.io/#/migrations) and [tutorial](https://betterprogramming.pub/typeorm-migrations-explained-fdb4f27cb1b3)

- Migrations are stored in folder `src/migration/`.
- To turn on migrations in file `src/services/databaseService.ts` set following: `synchronize: false` and `migrationsRun: true`.
- To create a migration user following command `typeorm migration:generate -n <nameOfMigrationFile>` and new migration template will be created in folder `src/migration/` .
  -  Fill in `up` function with desired migration. Fill in `down` function with reversed migration or just simply put `return`.


## Syncing artifacts

Clone the `flare-smart-contracts` repo into the same parent folder as this repo. Set the relevant branch on the `flare-smart-contracts` 
repo and compile the contracts. Then run:

```
yarn artifacts
```

This will sync the `artifacts` folder for the contract with names defined in the `contractToSync` list in [`src/utils/sync-artifacts.ts`](src/utils/sync-artifacts.ts) and run Typechain type file generation (generates the folder `typechain-web3-v1`). 