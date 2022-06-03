#!/usr/bin/env node

import dotenv from "dotenv";
import { iocContainer } from "./ioc";
import { ConfigurationService } from "./services/ConfigurationService";
import { ContractService } from "./services/ContractService";
import { EventProcessorService } from "./services/EventProcessorService";

// initialize configuration
dotenv.config();

let yargs = require("yargs");

let args = yargs
   .option("network", { alias: "n", type: "string", description: "The name of the network", default: "coston" })
   .option("batchSize", { alias: "b", type: "number", description: "Batch size for blocks to process events" })
   .argv;

const eventProcessorService = iocContainer(null).get(EventProcessorService)
const configurationService = iocContainer(null).get(ConfigurationService)
const contractService = iocContainer(null).get(ContractService)
// override network
configurationService.network = args['network'];

async function runEventCollector() {
   await contractService.waitForInitialization();
   let batchSize = args['batchSize'] ? args['batchSize'] : configurationService.maxBlocksForEventReads;
   await eventProcessorService.processEvents(batchSize);
}

runEventCollector()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });




