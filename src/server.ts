#!/usr/bin/env node

import { app } from './app';
import { iocContainer } from './ioc';
import { logException } from './logger/logger';
import { ConfigurationService } from './services/ConfigurationService';
import { DatabaseService } from './services/DatabaseService';
import { LoggerService } from './services/LoggerService';
import { MultiChainService } from './services/MultiChainService';

const configurationService = iocContainer(null).get(ConfigurationService);
const loggerService = iocContainer(null).get(LoggerService);
const dbService = iocContainer(null).get(DatabaseService);

const server = app.listen(configurationService.webServerOptions.port, () => {
   // tslint:disable-next-line:no-console
   loggerService.logger.info(`Server started listening at http://localhost:${configurationService.webServerOptions.port}`);
   void dbService.waitForDBConnection();
});

dbService.waitForDBConnection().then(() => {
   iocContainer(null).get(MultiChainService);
}).catch(err => {
   logException(err, 'Error getting DB connection');
});
