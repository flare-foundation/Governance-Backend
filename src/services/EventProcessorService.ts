import { BaseEntity } from "typeorm";
import { Factory, Inject, Singleton } from "typescript-ioc";
import { DBState } from "../entity/DBState";
import { AttLogger, logException } from "../logger/logger";
import { getUnixEpochTimestamp, sleepms } from "../utils/utils";
import { ConfigurationService } from "./ConfigurationService";
import { ContractService } from "./ContractService";
import { DatabaseService } from "./DatabaseService";
import { LoggerService } from "./LoggerService";

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
      const res = await this.dbService.manager.findOne(DBState, { where: { name: "lastProcessedBlock" } });
      let lastProcessedBlock = -1;
      if (!res) {
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


   async saveEvents(eventEntities: BaseEntity[], newLastProcessedBlock: number) {
      await this.dbService.connection.transaction(async (transaction) => {
         const stateEntities = [
            this.getStateEntry("lastProcessedBlock", newLastProcessedBlock),
         ];
         if(eventEntities.length > 0) {
            await transaction.save(eventEntities);
         }         
         await transaction.save(stateEntities);
      });

   }
   async processEvents(batchSize = 100) {
      // wait until new block is set
      await this.dbService.waitForDBConnection();
      await this.contractService.waitForInitialization();
      this.logger.info(`waiting for network connection...`);
      const blockHeight = await this.contractService.web3.eth.getBlockNumber();
      let nextBlockToProcess; 
      
      let firstRun = true;
      while (true) {
         try {
            let currentBlockNumber = await this.contractService.web3.eth.getBlockNumber();
            nextBlockToProcess = await this.getLastProcessedBlock(currentBlockNumber) + 1;
            if(firstRun) {
               this.logger.info(`^Rnetwork event processing started ^Y${nextBlockToProcess} (height ${blockHeight})`);
               firstRun = false;
            }
            this.logger.info(`Current block: ${currentBlockNumber}, next ${nextBlockToProcess}`)
            // wait for new block
            if (nextBlockToProcess >= currentBlockNumber + 1) {
               await sleepms(1000);
               continue;
            }

            let endBlock = Math.min(nextBlockToProcess + batchSize - 1, currentBlockNumber);
            let contractEventBatches = await this.contractService.getEventsFromBlocks(
               this.configurationService.eventCollectedContracts,
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

            console.log(nextBlockToProcess, newLastProcessedBlock)            
            let dbEntities: BaseEntity[] = [];
            for(let ceb of contractEventBatches) {
               let newEntites = await this.contractService.processEvents(ceb);
               dbEntities.push(...newEntites);
            }

            await this.saveEvents(dbEntities, newLastProcessedBlock);    
         }
         catch (error) {
            logException(error, `EventProcessorService::processEvents`);
         }
      }
   }

}
