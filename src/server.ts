#!/usr/bin/env node

import { app } from "./app";
import { iocContainer } from "./ioc";
import { ConfigurationService } from "./services/ConfigurationService";
import { DatabaseService } from "./services/DatabaseService";

const configurationService = iocContainer(null).get(ConfigurationService)
const dbService = iocContainer(null).get(DatabaseService);

const server = app.listen(configurationService.webServerOptions.port, () => {
    // tslint:disable-next-line:no-console
    // console.log(`Server started listening at http://localhost:${ port }`)
    dbService.logger.info(`Server started listening at http://localhost:${configurationService.webServerOptions.port}`)
}
);






