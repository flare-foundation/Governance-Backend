import { Factory, Inject, Singleton } from "typescript-ioc";
import { ConfigurationService } from "./ConfigurationService";
import fs from "fs";
import Web3 from "web3";
import { LoggerService } from "./LoggerService";
import { AttLogger, logException } from "../logger/logger";
import { getWeb3, getWeb3Contract, sleepms, waitFinalize3Factory } from "../utils/utils";
import { GovernanceVotePower } from "../../typechain-web3-v1/GovernanceVotePower";
import { GovernorReject } from "../../typechain-web3-v1/GovernorReject";
import { GovernorAccept } from "../../typechain-web3-v1/GovernorAccept";
import { WNat } from "../../typechain-web3-v1/wNat";
import { BaseEntity } from "typeorm";
import { DBProposalCreated } from "../entity/DBProposalCreated";
import { DBProposalSettingsReject } from "../entity/DBProposalSettingsReject";
import { DBVoteCast } from "../entity/DBVoteCast";

export interface ContractDeploy {
   name: string;
   contractName: string;
   address: string;
};

export interface ContractEventBatch {
   contractName: string;
   startBlock: number;
   endBlock: number;
   events: any[];
}

export const DEFAULT_GAS = "2500000";
export const DEFAULT_GAS_PRICE = "50000000000"; // 50 Gwei

@Singleton
@Factory(() => new ContractService())
export class ContractService {

   @Inject
   configurationService: ConfigurationService;

   @Inject
   loggerService: LoggerService

   get logger(): AttLogger {
      return this.loggerService.logger;
   }

   initialized = false;

   public web3: Web3;
   private deployMap = new Map<string, any>();
   constructor() {
      this.init();
   }

   waitFinalize3: (sender: string, func: () => any, delay?: number) => Promise<any>;

   async init() {
      this.web3 = getWeb3(this.configurationService.networkRPC, this.logger);
      let deployFname = `deploys/${ConfigurationService.network}.json`;
      let deployData = JSON.parse(fs.readFileSync(deployFname).toString()) as ContractDeploy[];
      for (let contractDeploy of deployData) {
         let contract = await getWeb3Contract(this.web3, contractDeploy.address, contractDeploy.name);
         this.deployMap.set(contractDeploy.name, contract)
      }
      this.initialized = true;
      this.waitFinalize3 = waitFinalize3Factory(this.web3);
   }

   public async getContract(name: string): Promise<any> {
      await this.waitForInitialization();
      return this.deployMap.get(name);
   }

   public async signSendAndFinalize(
      account: any,
      label: string,
      toAddress: string,
      fnToEncode: any,
      gas: string = DEFAULT_GAS,
      gasPrice: string = DEFAULT_GAS_PRICE
   ): Promise<any> {
      try {
         let nonce = (await this.web3.eth.getTransactionCount(account.address)) + '';
         const tx = {
            from: account.address,
            to: toAddress,
            gas,
            gasPrice,
            data: fnToEncode.encodeABI(),
            nonce,
         };
         const signedTx = await account.signTransaction(tx);

         try {
            const receipt = await this.waitFinalize3(account.address, () => this.web3.eth.sendSignedTransaction(signedTx.rawTransaction!));
            return { receipt, nonce };
         } catch (e: any) {
            if (e.message.indexOf(`Transaction has been reverted by the EVM`) < 0) {
               logException(`${label}, nonce sent: ${nonce}`, e);
            } else {
               try {
                  const result = await fnToEncode.call({ from: account.address });
                  throw Error("unlikely to happen: " + JSON.stringify(result));
               }
               catch (revertReason) {
                  this.logger.error2(`${label}, nonce sent: ${nonce}, revert reason: ${revertReason}`);
               }
            }
            return null;
         }
      }
      catch (error) {
         logException(error, `signSendAndFinalize3`);
      }
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

   /// Specific contracts - add them manually here

   public async governanceVotePower(): Promise<GovernanceVotePower> {
      return (await this.getContract("GovernanceVotePower")) as GovernanceVotePower;
   }

   public async governorReject(): Promise<GovernorReject> {
      return (await this.getContract("GovernorReject")) as GovernorReject;
   }

   public async governorAccept(): Promise<GovernorAccept> {
      return (await this.getContract("GovernorAccept")) as GovernorAccept;
   }

   public async wNat(): Promise<WNat> {
      return (await this.getContract("wNat")) as WNat;
   }

   public async getEventsFromBlockForContract(contractName: string, startBlock: number, endBlock: number): Promise<ContractEventBatch> {
      let contract = await this.getContract(contractName);
      if (!contract) {
         return {
            contractName,
            startBlock,
            endBlock,
            events: []
         } as ContractEventBatch;
      }
      const events = await contract.getPastEvents("allEvents", { fromBlock: startBlock, toBlock: endBlock });
      if(events.length > 0) {
         this.logger.info(`${contractName}: ${events.length} new event(s)`);
      }
      return {
         contractName,
         startBlock,
         endBlock,
         events
      } as ContractEventBatch;
   }

   // endBlock should already be produce, otherwise exception is thrown.
   public async getEventsFromBlocks(contractNames: string[], startBlock: number, endBlock: number): Promise<ContractEventBatch[]> {
      let promises = [];
      for (let contractName of contractNames) {
         promises.push(this.getEventsFromBlockForContract(contractName, startBlock, endBlock))
      }
      return await Promise.all(promises);
   }

   public processEvents(batch: ContractEventBatch): any[] {
      switch (batch.contractName) {
         case "GovernanceVotePower":
            return this.processGovernanceVotePowerEvents(batch);
         case "GovernorReject":
            return this.processGovernorRejectEvents(batch);
         case "GovernorAccept":
            return this.processGovernorAcceptEvents(batch);
         case "wNat":
            return this.processWNatEvents(batch);
         default:
            return [];
      }
   }

   ////////////////////////////////////////////////////////////////////////
   ////// GovernorReject events
   ////////////////////////////////////////////////////////////////////////

   public processGovernorRejectEvents(batch: ContractEventBatch): any[] {
      if (batch.contractName !== "GovernorReject") {
         throw new Error(`Wrong event batch. Should be for 'GovernorReject' but it is for ${batch.contractName}`);
      }
      let dbEntities: any[] = [];

      for (let event of batch.events) {
         if (event.event === "ProposalCreated") {
            dbEntities.push(DBProposalCreated.fromEvent(event))
         }
         if (event.event === "ProposalSettingsReject") {
            dbEntities.push(DBProposalSettingsReject.fromEvent(event))
         }
         if (event.event === "VoteCast") {
            dbEntities.push(DBVoteCast.fromEvent(event))
         }
      }
      return dbEntities;
   }

   public processGovernorAcceptEvents(batch: ContractEventBatch): any[] {
      let dbEntities: any[] = [];
      return dbEntities;
   }

   public processGovernanceVotePowerEvents(batch: ContractEventBatch): any[] {
      let dbEntities: any[] = [];
      return dbEntities;
   }


   public processWNatEvents(batch: ContractEventBatch): any[] {
      let dbEntities: any[] = [];
      return dbEntities;
   }
}



// Needed database records
// 1) Record of all created proposals 
//    a) Listen for event 'ProposalCreated' and save all parameters  
//    b) Depending on which contract emits the event, we store the proposal type (rejection, acceptance)
// 2) Additional proposal properties 
//    a) listen for event 'ProposalSettingsReject' (for rejection type) and store all parameters 
//    b) listen for event 'ProposalSettingsAccept' (for acceptance type) and store all parameters 
//    - THIS CONTRACT WILL BE DEPLOYED LATER 
//    c) data can be a linked to table (1) through proposalId
// 3) Record of all votes regarding a specific proposal 
//    a) listen to event 'VoteCast' and store all parameters 
//    b) also store the timestamp of emitted event 
//    c) data can be linked to table (1) through proposalId
// 4) Records of proposal numbers that are listed on a detailed proposal description page 
//    a) numbers are integers that are inputted when creating a proposal through the online form
//    current location: https://github.com/flare-foundation/STP/tree/main/STPs 
