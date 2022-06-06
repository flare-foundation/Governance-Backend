import { Factory, Singleton } from "typescript-ioc";
import { DatabaseConnectOptions, WebServerOptions } from "../utils/interfaces";
@Singleton
@Factory(() => new ConfigurationService())
export class ConfigurationService {

   network = process.env.NETWORK;

   networkRPC = process.env.RPC;
   maxBlocksForEventReads = process.env.MAX_BLOCKS_FOR_EVENT_READS ? parseInt(process.env.MAX_BLOCKS_FOR_EVENT_READS) : undefined;

   databaseConnectOptions: DatabaseConnectOptions = {
      type: process.env.DB_TYPE,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD
   }

   // These names should match
   eventCollectedContracts = [
      "GovernanceVotePower",
      "GovernorReject",
      "GovernorAccept",
      "GovernorAccept1",
      "GovernorAccept2",
      "wNat"
   ];
   
   webServerOptions: WebServerOptions = {
      port: parseInt(process.env.WEB_SERVER_PORT),
   }

   // For testing purposes only in development
   proposerPrivateKeys = [];
   voterPrivateKeys = [];

   constructor() {
      this.initProposerPrivateKeys();
      this.initVoterPrivateKeys();
   }

   initProposerPrivateKeys() {
      if (process.env.NODE_ENV == "development") {
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
      if (process.env.NODE_ENV == "development") {
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
