#!/usr/bin/env node

import { iocContainer } from "./ioc";
import { ConfigurationService } from "./services/ConfigurationService";
import { EventProcessorService } from "./services/EventProcessorService";

let yargs = require("yargs");

let args = yargs
    .option("network", { alias: "n", type: "string", description: "The name of the network", default: "coston" })
    .option("batchSize", { alias: "b", type: "number", description: "Batch size for blocks to process events", default: 100 })
    .argv;

ConfigurationService.network = args['network'];

const eventProcessorService = iocContainer(null).get(EventProcessorService)

async function runEventIndexer() {
   await eventProcessorService.processEvents(args['batchSize']);
}

runEventIndexer()
.then(() => process.exit(0))
.catch((error) => {
   console.error(error);
   process.exit(1);
});




