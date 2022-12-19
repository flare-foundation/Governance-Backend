import { Factory, Singleton } from 'typescript-ioc';
import { readJSON } from '../utils/config-utils';
import { DatabaseConnectOptions, INetworkConfigJson, WebServerOptions } from '../utils/interfaces';
@Singleton
@Factory(() => new ConfigurationService())
export class ConfigurationService {
   network: string;
   chainId: number;

   networkRPC: string;
   maxBlocksForEventReads: number;
   indexingStartBlock: number;

   databaseConnectOptions: DatabaseConnectOptions = {
      type: process.env.DB_TYPE,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
   };

   // These names should match
   eventCollectedContracts: string[] = [];

   webServerOptions: WebServerOptions = {
      port: parseInt(process.env.WEB_SERVER_PORT),
   };

   // For testing purposes only in development
   proposerPrivateKeys = [];
   voterPrivateKeys = [];

   constructor() {
      if (process.env.CONFIG_FILE) {
         const configFile = readJSON<INetworkConfigJson>(process.env.CONFIG_FILE);

         this.chainId = configFile.CHAIN_ID;
         this.network = configFile.NETWORK;

         this.networkRPC = process.env.RPC ? process.env.RPC : configFile.RPC;

         this.maxBlocksForEventReads = configFile.MAX_BLOCKS_FOR_EVENT_READS ? configFile.MAX_BLOCKS_FOR_EVENT_READS : undefined;
         this.maxBlocksForEventReads = process.env.MAX_BLOCKS_FOR_EVENT_READS ? parseInt(process.env.MAX_BLOCKS_FOR_EVENT_READS) : this.maxBlocksForEventReads;
         this.indexingStartBlock = configFile.INDEXING_START_BLOCK ? configFile.INDEXING_START_BLOCK : undefined;
         this.indexingStartBlock = process.env.INDEXING_START_BLOCK ? parseInt(process.env.INDEXING_START_BLOCK) : this.indexingStartBlock;

         this.eventCollectedContracts = configFile.EVENT_COLLECTED_CONTRACTS;
      }
      this.initProposerPrivateKeys();
      this.initVoterPrivateKeys();
   }

   initProposerPrivateKeys() {
      if (process.env.NODE_ENV == 'development') {
         let i = 0;
         let pk = process.env[`PROPOSER_PK_${i}`];
         while (pk) {
            this.proposerPrivateKeys.push(pk);
            i++;
            pk = process.env[`PROPOSER_PK_${i}`];
         }
      }
   }

   initVoterPrivateKeys() {
      if (process.env.NODE_ENV == 'development') {
         let i = 0;
         let pk = process.env[`VOTER_PK_${i}`];
         while (pk) {
            this.voterPrivateKeys.push(pk);
            i++;
            pk = process.env[`VOTER_PK_${i}`];
         }
      }
   }
}
