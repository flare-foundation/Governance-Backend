import fs from "fs";
import { Factory, Inject, Singleton } from "typescript-ioc";
import Web3 from "web3";
import { GovernanceVotePower } from "../../typechain-web3-v1/GovernanceVotePower";
import { PollingAccept } from "../../typechain-web3-v1/PollingAccept";
import { PollingReject } from "../../typechain-web3-v1/PollingReject";
import { WNat } from "../../typechain-web3-v1/wNat";
import { PollingContractType } from "../dto/Proposal";
import { DBContract } from "../entity/DBContract";
import { DBProposal } from "../entity/DBProposal";
import { DBVote } from "../entity/DBVote";
import { AttLogger, logException } from "../logger/logger";
import { DBEntities } from "../utils/DBEntities";
import { ContractDeploy, ContractEventBatch, DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../utils/interfaces";
import { getWeb3, getWeb3ContractWithAbi, sleepms, waitFinalize3Factory } from "../utils/utils";
import { ConfigurationService } from "./ConfigurationService";
import { DatabaseService } from "./DatabaseService";
import { LoggerService } from "./LoggerService";

@Singleton
@Factory(() => new ContractService())
export class ContractService {

   @Inject
   configurationService: ConfigurationService;

   @Inject
   dbService: DatabaseService;

   @Inject
   loggerService: LoggerService;

   get logger(): AttLogger {
      return this.dbService.logger;
   }

   constructor() {
      this.init();
   }
   initialized = false;

   public web3: Web3;
   private deployMap = new Map<string, any>();
   private addressToContactInfo = new Map<string, ContractDeploy>();

   public deployData: ContractDeploy[];

   waitFinalize3: (sender: string, func: () => any, delay?: number) => Promise<any>;

   async init() {
      await this.dbService.waitForDBConnection();
      this.web3 = getWeb3(this.configurationService.networkRPC, this.logger);
      let deployFname = `deploys/${this.configurationService.network}.json`;
      this.deployData = JSON.parse(fs.readFileSync(deployFname).toString()) as ContractDeploy[];
      for (let contractDeploy of this.deployData) {
         let [contractName] = contractDeploy.contractName.split(".");
         let { contract, abi } = await getWeb3ContractWithAbi(this.web3, contractDeploy.address, contractName);
         this.deployMap.set(contractDeploy.name, contract);
         contractDeploy.address = contractDeploy.address.toLowerCase();
         this.addressToContactInfo.set(contractDeploy.address.toLowerCase(), contractDeploy);
         contractDeploy.abi = abi;
         let dbContract = DBContract.fromData(contractDeploy);
         this.dbService.manager.save(dbContract);
      }
      this.waitFinalize3 = waitFinalize3Factory(this.web3);
      this.initialized = true;
   }

   get availableContractNames(): string[] {
      return [...this.deployMap.keys()];
   }

   public async getContract(name: string): Promise<any> {
      await this.waitForInitialization();
      return this.deployMap.get(name);
   }

   public contractInfoForAddress(address: string): ContractDeploy {
      return this.addressToContactInfo.get(address);
   }

   public async getContractFromAddress(address: string): Promise<PollingAccept | PollingReject> {
      await this.waitForInitialization();
      let deployInfo = this.addressToContactInfo.get(address.toLowerCase());
      if (deployInfo) {
         return this.deployMap.get(deployInfo.name) as PollingAccept | PollingReject;
      }
   }

   public async signSendAndFinalize(
      account: any,
      label: string,
      toAddress: string,
      fnToEncode: any,
      value = "0",
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
            value,
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

   public async pollingReject(): Promise<PollingReject> {
      return (await this.getContract("GovernorReject")) as PollingReject;
   }

   public async pollingAccept(): Promise<PollingAccept> {
      return (await this.getContract("GovernorAccept")) as PollingAccept;
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
      if (events.length > 0) {
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

   public processEvents(batch: ContractEventBatch): DBEntities {
      if (batch.contractName === "GovernanceVotePower") {
         return this.processGovernanceVotePowerEvents(batch);
      }
      if (batch.contractName === "wNat") {
         return this.processWNatEvents(batch);
      }
      if (batch.contractName.startsWith("PollingAccept") || batch.contractName.startsWith("PollingReject")) {
         return this.processGovernorEvents(batch);
      }
      return new DBEntities();
   }

   public processGovernorEvents(batch: ContractEventBatch): DBEntities {
      let result = new DBEntities();
      let voteType: PollingContractType = batch.contractName.startsWith("PollingAccept") ? "accept" : "reject";
      for (let event of batch.events) {
         if (event.event === "ProposalCreated") {
            result.proposals.push(DBProposal.fromEvent(event, voteType))
         }
         if (event.event === "VoteCast") {
            result.castedVotes.push(DBVote.fromEvent(event))
         }
         if (event.event === "ProposalExecuted") {
            result.refreshProposalIds.push(event.returnValues.proposalId)
         }
         if (event.event === "ProposalExecuted") {
            result.refreshProposalIds.push(event.returnValues.proposalId)
         }
      }
      return result;
   }

   public processGovernanceVotePowerEvents(batch: ContractEventBatch): DBEntities {
      return new DBEntities();
   }

   public processWNatEvents(batch: ContractEventBatch): DBEntities {
      return new DBEntities();
   }

   public async votePowerForProposalId(voterAddress: string, votePowerBlock: number): Promise<string>{
     const votePowerC = await this.governanceVotePower()
     return await votePowerC.methods.votePowerOfAt(voterAddress, votePowerBlock).call();
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
