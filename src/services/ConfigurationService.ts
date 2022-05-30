import { Factory, Singleton } from "typescript-ioc";

export interface DatabaseConnectOptions {
   type: string;
   host: string;
   port: number;
   database: string;
   username: string;
   password: string;
}

export interface WebServerOptions {
   port: number;
}

@Singleton
@Factory(() => new ConfigurationService())
export class ConfigurationService {

   // should be set on the start-up of the service once (global constant)
   public static network = "";

   networkRPC = process.env.RPC;

   databaseConnectOptions = {
      type: process.env.DB_TYPE,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD
   }

   eventCollectedContracts = [
      "GovernanceVotePower",
      "GovernorReject",
      "GovernorAccept",
      "wNat"
   ];
   
   webServerOptions = {
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
            this.proposerPrivateKeys.push(pk);
            i++;
            pk = process.env[`VOTER_PK_${i}`];
         }
      }
   }

}
