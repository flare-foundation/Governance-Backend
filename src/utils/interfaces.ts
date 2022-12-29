export interface ContractDeploy {
   name: string;
   contractName: string;
   address: string;
   chainId: number;
   abi?: any;
}

export interface ContractEventBatch {
   contractName: string;
   startBlock: number;
   endBlock: number;
   events: any[];
}

export const DEFAULT_GAS = '2500000';
export const DEFAULT_GAS_PRICE = '50000000000'; // 50 Gwei

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

// Config file exports
export interface INetworkConfigJson {
   NETWORK: string;
   CHAIN_ID: number;
   RPC: string;
   MAX_BLOCKS_FOR_EVENT_READS?: number;
   INDEXING_START_BLOCK?: number;
   EVENT_COLLECTED_CONTRACTS: string[];
   FTSO_PROVIDERS_URL?: string;
   FTSO_PROVIDERS_CRON_STRING?: string;
}
