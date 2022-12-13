import fs from 'fs';
import { Factory, Inject, Singleton } from 'typescript-ioc';
import Web3 from 'web3';
import { GovernanceVotePower } from '../../typechain-web3-v1/GovernanceVotePower';
import { PollingFoundation, ProposalCanceled, ProposalExecuted } from '../../typechain-web3-v1/PollingFoundation';
import { BaseContract } from '../../typechain-web3-v1/types';
import { WNat } from '../../typechain-web3-v1/wNat';
import { DBContract } from '../entity/DBContract';
import { DBProposal } from '../entity/DBProposal';
import { DBVote } from '../entity/DBVote';
import { AttLogger, logException } from '../logger/logger';
import { DBEntities, VoteResult } from '../utils/DBEntities';
import { ContractDeploy, ContractEventBatch, DEFAULT_GAS, DEFAULT_GAS_PRICE } from '../utils/interfaces';
import { getWeb3, getWeb3ContractWithAbi, sleepms, waitFinalize3Factory } from '../utils/utils';
import { ConfigurationService } from './ConfigurationService';
import { DatabaseService } from './DatabaseService';
import { LoggerService } from './LoggerService';
import { NetworkService } from './NetworkService';

@Singleton
@Factory(() => new ContractService())
export class ContractService {
   @Inject
   configurationService: ConfigurationService;

   @Inject
   dbService: DatabaseService;

   @Inject
   loggerService: LoggerService;

   @Inject
   networkService: NetworkService;

   get logger(): AttLogger {
      return this.dbService.logger;
   }

   constructor() {
      void this.init();
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
         let [contractName] = contractDeploy.contractName.split('.');
         let { contract } = await getWeb3ContractWithAbi(this.web3, contractDeploy.address, contractName);
         this.deployMap.set(contractDeploy.name, contract);
         contractDeploy.address = contractDeploy.address.toLowerCase();
         this.addressToContactInfo.set(contractDeploy.address.toLowerCase(), contractDeploy);
         //  contractDeploy.abi = abi;
         let dbContract = DBContract.fromData(contractDeploy, this.configurationService.chainId);
         await this.dbService.manager.save(dbContract);
      }
      this.waitFinalize3 = waitFinalize3Factory(this.web3);
      this.initialized = true;
   }

   get availableContractNames(): string[] {
      return [...this.deployMap.keys()];
   }

   public async getContract<T extends BaseContract>(name: string): Promise<T> {
      await this.waitForInitialization();
      return this.deployMap.get(name);
   }

   public contractInfoForAddress(address: string): ContractDeploy {
      return this.addressToContactInfo.get(address);
   }

   public async getContractFromAddress(address: string): Promise<PollingFoundation> {
      await this.waitForInitialization();
      let deployInfo = this.addressToContactInfo.get(address.toLowerCase());
      if (deployInfo) {
         return this.deployMap.get(deployInfo.name) as PollingFoundation;
      }
   }

   public async signSendAndFinalize(
      account: any,
      label: string,
      toAddress: string,
      fnToEncode: any,
      value = '0',
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
                  throw Error('unlikely to happen: ' + JSON.stringify(result));
               } catch (revertReason) {
                  this.logger.error2(`${label}, nonce sent: ${nonce}, revert reason: ${revertReason}`);
               }
            }
            return null;
         }
      } catch (error) {
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
         } catch (error) {
            logException(error, `waitForDBConnection`);
            await sleepms(1000);
            continue;
         }
         break;
      }
   }

   /// Specific contracts - add them manually here

   public async governanceVotePower(): Promise<GovernanceVotePower> {
      return this.getContract<GovernanceVotePower>('GovernanceVotePower');
   }

   public async pollingFoundation(): Promise<PollingFoundation> {
      return this.getContract<PollingFoundation>('PollingFoundation');
   }

   public async wNat(): Promise<WNat> {
      return this.getContract<WNat>('wNat');
   }

   public async getEventsFromBlockForContract(contractName: string, startBlock: number, endBlock: number): Promise<ContractEventBatch> {
      let contract = await this.getContract(contractName);
      if (!contract) {
         return {
            contractName,
            startBlock,
            endBlock,
            events: [],
         } as ContractEventBatch;
      }
      const events = await contract.getPastEvents('allEvents', { fromBlock: startBlock, toBlock: endBlock });
      if (events.length > 0) {
         this.logger.info(`${contractName}: ${events.length} new event(s)`);
      }
      return {
         contractName,
         startBlock,
         endBlock,
         events,
      } as ContractEventBatch;
   }

   // endBlock should already be produce, otherwise exception is thrown.
   public async getEventsFromBlocks(contractNames: string[], startBlock: number, endBlock: number): Promise<ContractEventBatch[]> {
      let promises = [];
      for (let contractName of contractNames) {
         promises.push(this.getEventsFromBlockForContract(contractName, startBlock, endBlock));
      }
      return Promise.all(promises);
   }

   public async processEvents(batch: ContractEventBatch): Promise<DBEntities> {
      if (batch.contractName === 'GovernanceVotePower') {
         return this.processGovernanceVotePowerEvents(batch);
      }
      if (batch.contractName === 'wNat') {
         return this.processWNatEvents(batch);
      }
      if (batch.contractName === 'PollingFoundation') {
         return this.processPollingFoundationEvents(batch);
      }
      return new DBEntities();
   }

   public async processPollingFoundationEvents(batch: ContractEventBatch): Promise<DBEntities> {
      const result = new DBEntities();
      for (const event of batch.events) {
         if (event.event === 'ProposalCreated') {
            // created proposal needs block timestamp
            const votePowerBlockTs = await this.networkService.getBlockTimestamp(parseInt(event.returnValues.votePowerBlock));
            result.proposals.push(DBProposal.fromEvent(event, votePowerBlockTs, this.configurationService.chainId));
         }
         if (event.event === 'VoteCast') {
            result.castedVotes.push(DBVote.fromEvent(event, this.configurationService.chainId));
            result.voteResults.push(VoteResult.fromEvent(event));

         }
         if (event.event === 'ProposalExecuted') {
            result.executedProposalIds.push((event as ProposalExecuted).returnValues.proposalId);
         }
         if (event.event === 'ProposalCanceled') {
            result.canceledProposalIds.push((event as ProposalCanceled).returnValues.proposalId);
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

   public async votePowerForProposalId(voterAddress: string, votePowerBlock: number): Promise<string> {
      const votePowerC = await this.governanceVotePower();
      return votePowerC.methods.votePowerOfAt(voterAddress, votePowerBlock).call();
   }
}

