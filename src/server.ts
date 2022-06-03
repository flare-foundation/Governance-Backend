#!/usr/bin/env node

import { app } from "./app";
import { iocContainer } from "./ioc";
import { ConfigurationService } from "./services/ConfigurationService";
import { ContractService } from "./services/ContractService";
import { DatabaseService } from "./services/DatabaseService";
import { LoggerService } from "./services/LoggerService";

const configurationService = iocContainer(null).get(ConfigurationService)
const loggerService = iocContainer(null).get(LoggerService)
const dbService = iocContainer(null).get(DatabaseService);


const server = app.listen(configurationService.webServerOptions.port, () => {
   // tslint:disable-next-line:no-console
   loggerService.logger.info(`Server started listening at http://localhost:${configurationService.webServerOptions.port}`)
   dbService.waitForDBConnection();
});

dbService.waitForDBConnection().then(() => {
   const contractService = iocContainer(null).get(ContractService);
})








