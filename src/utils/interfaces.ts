import { DBProposal } from "../entity/DBProposal";
import { DBVote } from "../entity/DBVote";

export interface ContractDeploy {
   name: string;
   contractName: string;
   address: string;
   abi?: any;
};

export interface ContractEventBatch {
   contractName: string;
   startBlock: number;
   endBlock: number;
   events: any[];
}

export const DEFAULT_GAS = "2500000";
export const DEFAULT_GAS_PRICE = "50000000000"; // 50 Gwei

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
