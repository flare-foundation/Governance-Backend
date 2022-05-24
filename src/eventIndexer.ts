#!/usr/bin/env node

import { iocContainer } from "./ioc";
import { ConfigurationService } from "./services/ConfigurationService";
import { DatabaseService } from "./services/DatabaseService";

let yargs = require("yargs");

let args = yargs
    .option("network", { alias: "n", type: "string", description: "The name of the network", default: "coston" })
    .argv;

ConfigurationService.network = args['network'];

const configurationService = iocContainer(null).get(ConfigurationService)
const dbService = iocContainer(null).get(DatabaseService);









