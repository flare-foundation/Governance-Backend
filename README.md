# Governance backend

This is a Node.js backend server for the governance dapp.

## Architecture

The project is using the library [TSOA](https://tsoa-community.github.io/docs/), a Typescript upgrade of express server that includes support for dependency injection. It also includes [TypeORM](https://typeorm.io) as the ORM library. Primarily it is designed for use with MySQL database.

## Getting started (development)

- Clone this repo 
```bash
git checkout https://github.com/flare-foundation/Governance-Backend.git
```
- Set up the [database](./docs/database.md)
- Set up [configurations](./docs/configurations.md)
- Install packages
```bash
yarn 
````
- Run event collector process
```bash
yarn event-collector
```
- Run web server
```bash
yarn dev
```
- Use [`governor-cli`](./docs/governor-cli.md) tool to create proposals and submit votes.
- Use swagger API at `http://localhost:9500/api-doc/` for testing.

If controller are changed, regenerate API specifications by running
```bash
yarn routes
```

To deploy the project on the Ubuntu server, see [instructions](./docs/deployment.md)
