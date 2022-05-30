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

   startingBlockNumber: number = -1;
   currentBlockNumber: number;

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
      this.logger.info(`waiting for network connection...`);
      const blockHeight = await this.contractService.web3.eth.getBlockNumber();
      let nextBlockToProcess = await this.getLastProcessedBlock(blockHeight) + 1;

      this.logger.info(`^Rnetwork event processing started ^Y${this.startingBlockNumber} (height ${blockHeight})`);

      while (true) {
         try {
            let currentBlockNumber = await this.contractService.web3.eth.getBlockNumber();
            // wait for new block
            if (nextBlockToProcess >= this.currentBlockNumber + 1) {
               await sleepms(1000);
               continue;
            }

            let contractEventBatches = await this.contractService.getEventsFromBlock(
               this.configurationService.eventCollectedContracts,
               nextBlockToProcess,
               batchSize
            );

            let newLastProcessedBlock = -1;
            for (let ceb of contractEventBatches) {
               if (ceb.endBlock != null) {
                  newLastProcessedBlock = ceb.endBlock;
                  break;
               }
            }

            let dbEntities: BaseEntity[] = [];
            for(let ceb of contractEventBatches) {
               let newEntites = await this.contractService.processEvents(ceb);
               dbEntities.push(...newEntites);
            }

            await this.saveEvents(dbEntities, newLastProcessedBlock);
         }
         catch (error) {
            logException(error, `EventProcessorService::procesEvents`);
         }
      }
   }

}
