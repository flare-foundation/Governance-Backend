#!/usr/bin/env node

import dotenv from 'dotenv';
import { FtsoEngine } from './engines/ftsoEngine';
import { iocContainer } from './ioc';
import { ConfigurationService } from './services/ConfigurationService';
import { ContractService } from './services/ContractService';
import { EventProcessorService } from './services/EventProcessorService';

// initialize configuration
dotenv.config();

let yargs = require('yargs');

let args = yargs
   .option('config', {
      alias: 'c',
      type: 'string',
      description: 'The path to json config file with network information',
      default: 'configs/networks/coston.json',
   })
   .option('batchSize', { alias: 'b', type: 'number', description: 'Batch size for blocks to process events' }).argv;

process.env.CONFIG_FILE = args['config'];

const eventProcessorService = iocContainer(null).get(EventProcessorService);
const configurationService = iocContainer(null).get(ConfigurationService);
const contractService = iocContainer(null).get(ContractService);
const ftsoEngine = iocContainer(null).get(FtsoEngine);
// override network
// configurationService.network = args['config'];

async function runEventCollector() {
   await contractService.waitForInitialization();
   ftsoEngine.init();
   let batchSize = args['batchSize'] ? args['batchSize'] : configurationService.maxBlocksForEventReads;
   await eventProcessorService.processEvents(batchSize);
}

runEventCollector()
   .then(() => process.exit(0))
   .catch((error) => {
      console.error(error);
      process.exit(1);
   });
