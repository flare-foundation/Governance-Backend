import { Factory, Inject, Singleton } from 'typescript-ioc';
import Web3 from 'web3';
import { GovernanceVotePower } from '../../typechain-web3-v1/GovernanceVotePower';
import { PollingFoundation } from '../../typechain-web3-v1/PollingFoundation';
import { WNat } from '../../typechain-web3-v1/wNat';
import { DBContract } from '../entity/DBContract';
import { AttLogger, logException } from '../logger/logger';
import { readJSON } from '../utils/config-utils';
import { ContractDeploy, INetworkConfigJson } from '../utils/interfaces';
import { getWeb3, getWeb3ContractWithAbi, sleepms } from '../utils/utils';
import { DatabaseService } from './DatabaseService';
import { LoggerService } from './LoggerService';
import { NetworkService } from './NetworkService';
import fs from 'fs';

@Singleton
@Factory(() => new MultiChainService())
export class MultiChainService {
   @Inject
   dbService: DatabaseService;

   @Inject
   loggerService: LoggerService;

   @Inject
   networkService: NetworkService;
   configurationService: any;

   get logger(): AttLogger {
      return this.dbService.logger;
   }

   public chainConfigs: INetworkConfigJson[] = [];

   constructor() {
      const networkConfigs = process.env.CONNECTED_CONFIGS;
      const parsed = networkConfigs.replace(/\s/g, '').split(',');
      for (let conf of parsed) {
         this.chainConfigs.push(readJSON<INetworkConfigJson>(conf));
      }
      this.init();
   }
   initialized = false;

   public web3: Record<number, Web3> = {};
   private deployMap: Record<number, Record<string, any>> = {};
   private addressToContactInfo: Record<number, Record<string, ContractDeploy>> = {};

   public deployData: ContractDeploy[] = [];

   async init() {
      await this.dbService.waitForDBConnection();
      for (let config of this.chainConfigs) {
         this.web3[config.CHAIN_ID] = getWeb3(config.RPC, this.logger);
         let deployFname = `deploys/${config.NETWORK}.json`;
         this.deployMap[config.CHAIN_ID] = this.deployMap[config.CHAIN_ID] || {};
         this.addressToContactInfo[config.CHAIN_ID] = this.addressToContactInfo[config.CHAIN_ID] || {};
         for (let deployed of JSON.parse(fs.readFileSync(deployFname).toString()) as ContractDeploy[]) {
            deployed.chainId = config.CHAIN_ID;
            this.deployData.push(deployed);
         }
      }
      for (let contractDeploy of this.deployData) {
         let [contractName] = contractDeploy.contractName.split('.');
         let { contract } = await getWeb3ContractWithAbi(this.web3[contractDeploy.chainId], contractDeploy.address, contractName);
         this.deployMap[contractDeploy.chainId][contractDeploy.name] = contract;
         contractDeploy.address = contractDeploy.address.toLowerCase();
         this.addressToContactInfo[contractDeploy.chainId][contractDeploy.address.toLowerCase()] = contractDeploy;
         //  contractDeploy.abi = abi;
         let dbContract = DBContract.fromData(contractDeploy, contractDeploy.chainId);
         this.dbService.manager.save(dbContract);
      }
      this.initialized = true;
   }

   public availableContractNames(chainId: number): string[] {
      return Object.keys(this.deployMap[chainId]);
   }

   public async getContract(chainId: number, name: string): Promise<any> {
      await this.waitForInitialization();
      return this.deployMap[chainId]?.[name];
   }

   public contractInfoForAddress(chainId: number, address: string): ContractDeploy {
      return this.addressToContactInfo[chainId]?.[address];
   }

   public async getContractFromAddress(chainId: number, address: string): Promise<PollingFoundation> {
      await this.waitForInitialization();
      let deployInfo = this.addressToContactInfo[chainId]?.[address.toLowerCase()];
      if (deployInfo) {
         return this.deployMap[chainId]?.[deployInfo.name] as PollingFoundation;
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

   public async governanceVotePower(chainId: number): Promise<GovernanceVotePower> {
      return (await this.getContract(chainId, 'GovernanceVotePower')) as GovernanceVotePower;
   }

   public async pollingFoundation(chainId: number): Promise<PollingFoundation> {
      return (await this.getContract(chainId, 'PollingFoundation')) as PollingFoundation;
   }

   public async wNat(chainId: number): Promise<WNat> {
      return (await this.getContract(chainId, 'wNat')) as WNat;
   }

   public async votePowerForProposalId(chainId: number, voterAddress: string, votePowerBlock: number): Promise<string> {
      const votePowerC = await this.governanceVotePower(chainId);
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
