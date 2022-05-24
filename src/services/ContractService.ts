import { Factory, Inject, Singleton } from "typescript-ioc";
import { ConfigurationService } from "./ConfigurationService";
import fs from "fs";
import Web3 from "web3";
import { LoggerService } from "./LoggerService";
import { AttLogger } from "../logger/logger";
import { getWeb3, getWeb3Contract } from "../utils/utils";

export interface ContractDeploy {
   name: string;
   contractName: string;
   address: string;
};

@Singleton
@Factory(() => new ContractService())
export class ContractService {

   @Inject
   configurationService: ConfigurationService;

   @Inject
   loggerService: LoggerService

   logger: AttLogger;

   public web3: Web3;
   private deployMap = new Map<string, any>();
   constructor() {
      this.logger = this.loggerService.logger
      this.init();
   }

   init() {
      this.web3 = getWeb3(this.configurationService.networkRPC, this.logger);
      let deployFname = `deploys/${ConfigurationService.network}.json`;
      let deployData = JSON.parse(fs.readFileSync(deployFname).toString()) as ContractDeploy[];
      for (let contractDeploy of deployData) {
         let contract = getWeb3Contract(this.web3, contractDeploy.address, contractDeploy.name);
         this.deployMap.set(contractDeploy.name, contract)
      }
   }

   public getContract(name: string): any {
      return this.deployMap.get(name);
   }
}
