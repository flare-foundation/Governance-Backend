import { Factory, Inject, Singleton } from 'typescript-ioc';
import { DBProposal } from '../entity/DBProposal';
import { DBState } from '../entity/DBState';
import { AttLogger, logException } from '../logger/logger';
import { DBEntities } from '../utils/DBEntities';
import { getUnixEpochTimestamp, sleepms } from '../utils/utils';
import { ConfigurationService } from './ConfigurationService';
import { ContractService } from './ContractService';
import { DatabaseService } from './DatabaseService';
import { LoggerService } from './LoggerService';

@Singleton
@Factory(() => new EventProcessorService())
export class EventProcessorService {
   @Inject
   configurationService: ConfigurationService;

   @Inject
   loggerService: LoggerService;

   @Inject
   contractService: ContractService;

   @Inject
   dbService: DatabaseService;

   get logger(): AttLogger {
      return this.loggerService.logger;
   }

   initialized = false;

   async getLastProcessedBlock(blockHeight: number): Promise<number> {
      const res = await this.dbService.manager.findOne(DBState, { where: { name: 'lastProcessedBlock' } });
      if (!res) {
         if (this.configurationService.indexingStartBlock != null) {
            return this.configurationService.indexingStartBlock - 1;
         }
         return blockHeight - 1;
      }
      return res.valueNumber;
   }

   getStateEntry(name: string, value: number): DBState {
      const state = new DBState();

      state.name = name;
      state.valueNumber = value;
      state.timestamp = getUnixEpochTimestamp();

      return state;
   }

   async saveEntities(eventEntities: any[], newLastProcessedBlock: number) {
      await this.dbService.connection.transaction(async (transaction) => {
         const stateEntities = [this.getStateEntry('lastProcessedBlock', newLastProcessedBlock)];
         if (eventEntities.length > 0) {
            await transaction.save(eventEntities);
         }
         await transaction.save(stateEntities);
      });
   }

   async updateProposals(dbEntities: DBEntities): Promise<DBProposal[]> {
      const proposalMap = new Map<string, DBProposal>();

      // New proposals
      for (let proposal of dbEntities.proposals) {
         proposalMap.set(proposal.proposalId, proposal);
      }

      // Other proposals on which votes were but are not new
      let proposalsIdsToFetchSet = new Set<string>();
      for (let castedVote of dbEntities.castedVotes) {
         let proposalId = castedVote.proposalId;
         if (!proposalMap.has(proposalId)) {
            proposalsIdsToFetchSet.add(proposalId);
         }
      }
      for (let proposalId of dbEntities.executedProposalIds) {
         if (!proposalMap.has(proposalId)) {
            proposalsIdsToFetchSet.add(proposalId);
         }
      }
      for (let proposalId of dbEntities.canceledProposalIds) {
         if (!proposalMap.has(proposalId)) {
            proposalsIdsToFetchSet.add(proposalId);
         }
      }

      // This is not necessary because ids should be the same as in casted votes
      for (let voteResult of dbEntities.voteResults) {
         if (!proposalMap.has(voteResult.proposalId)) {
            proposalsIdsToFetchSet.add(voteResult.proposalId);
         }
      }

      // Get missing proposals
      let proposalIdsToFetch = [...proposalsIdsToFetchSet];
      let proposalsToRefresh: DBProposal[] = [];
      if (proposalIdsToFetch.length > 0) {
         let query = this.dbService.connection.manager
            .createQueryBuilder(DBProposal, 'proposal')
            .andWhere('proposal.proposalId IN (:...proposalIds)', { proposalIds: proposalIdsToFetch });
         proposalsToRefresh = await query.getMany();
         // add them into the map
         for (let proposal of proposalsToRefresh) {
            if (!proposalMap.has(proposal.proposalId)) {
               proposalMap.set(proposal.proposalId, proposal);
            }
         }
      }

      // Refresh vote result
      for (const voteResult of dbEntities.voteResults) {
         const proposal = proposalMap.get(voteResult.proposalId);
         if (!proposal) {
            // just in case, if proposal in not in db
            continue;
         }
         proposal.updateVotes(voteResult.newFor, voteResult.newAgainst);
      }

      // Refresh executed field
      for (const executedProposalId of dbEntities.executedProposalIds) {
         const proposal = proposalMap.get(executedProposalId);
         if (proposal) {
            proposal.executed = true;
         }
      }

      // Refresh canceled field
      for (const canceledProposalId of dbEntities.canceledProposalIds) {
         const proposal = proposalMap.get(canceledProposalId);
         if (proposal) {
            proposal.canceled = true;
         }
      }

      return [...dbEntities.proposals, ...proposalsToRefresh];
   }

   async processEvents(batchSize = 100) {
      // wait until new block is set
      await this.dbService.waitForDBConnection();
      await this.contractService.waitForInitialization();
      this.logger.info(`waiting for network connection...`);
      const blockHeight = await this.contractService.web3.eth.getBlockNumber();
      let nextBlockToProcess: number;

      let firstRun = true;
      while (true) {
         try {
            let currentBlockNumber = await this.contractService.web3.eth.getBlockNumber();
            nextBlockToProcess = (await this.getLastProcessedBlock(currentBlockNumber)) + 1;
            if (firstRun) {
               this.logger.info(`^Rnetwork event processing started ^Y${nextBlockToProcess} (height ${blockHeight})`);
               firstRun = false;
            }
            this.logger.info(`Current block: ${currentBlockNumber}, next ${nextBlockToProcess}`);
            // wait for new block
            if (nextBlockToProcess >= currentBlockNumber + 1) {
               await sleepms(1000);
               continue;
            }

            let endBlock = Math.min(nextBlockToProcess + batchSize - 1, currentBlockNumber);
            let contractEventBatches = await this.contractService.getEventsFromBlocks(
               this.contractService.availableContractNames,
               nextBlockToProcess,
               endBlock
            );

            let newLastProcessedBlock = -1;
            for (let ceb of contractEventBatches) {
               if (ceb.endBlock != null) {
                  newLastProcessedBlock = ceb.endBlock;
                  break;
               }
            }

            let dbEntities = new DBEntities();

            for (let ceb of contractEventBatches) {
               let entityData = await this.contractService.processEvents(ceb);
               dbEntities.proposals.push(...entityData.proposals);
               dbEntities.castedVotes.push(...entityData.castedVotes);
               dbEntities.executedProposalIds.push(...entityData.executedProposalIds);
               dbEntities.canceledProposalIds.push(...entityData.canceledProposalIds);
            }
            const proposalsToSave = await this.updateProposals(dbEntities);
            await this.saveEntities([...proposalsToSave, ...dbEntities.castedVotes], newLastProcessedBlock);
         } catch (error) {
            logException(error, `EventProcessorService::processEvents`);
         }
      }
   }
}
