import { Factory, Inject, Singleton } from "typescript-ioc";
import { AttLogger, logException } from "../logger/logger";
import { getWeb3Wallet, sleepms } from "../utils/utils";
import { ConfigurationService } from "./ConfigurationService";
import { ContractService } from "./ContractService";

@Singleton
@Factory(() => new TestAccountsService())
export class TestAccountsService {

   @Inject
   configurationService: ConfigurationService;

   @Inject
   contractService: ContractService;

   initialized = false;

   proposerAccounts = [];
   voterAccounts = [];

   constructor() {   
      this.init();
   }

   async init() {
      for(let pk of this.configurationService.proposerPrivateKeys) {
         let account = getWeb3Wallet(this.contractService.web3, pk);
         this.proposerAccounts.push(account);
      }
      for(let pk of this.configurationService.voterPrivateKeys) {
         let account = getWeb3Wallet(this.contractService.web3, pk);
         this.voterAccounts.push(account);
      }
      this.initialized = true;
   }

   get logger(): AttLogger {
      return this.contractService.logger;
   }
   
   public getProposerAccount(i: number) {
      if(i < 0 || i >= this.proposerAccounts.length) {
         throw new Error(`The proposer account with the index ${i} does not exist`);
      }
      return this.proposerAccounts[i]
   }

   public getVoterAccount(i: number) {
      if(i < 0 || i >= this.voterAccounts.length) {
         throw new Error(`The proposer account with the index ${i} does not exist`);
      }
      return this.voterAccounts[i]
   }

   public async waitForInitialization() {
      while (true) {
         try {
            if (!this.initialized) {
               this.logger.debug(`waiting for contract initialization`);
               await sleepms(1000);
               continue;
            }
         }
         catch (error) {
            logException(error, `waitForDBConnection`);
            await sleepms(1000);
            continue;
         }
         break;
      }
   }

}
