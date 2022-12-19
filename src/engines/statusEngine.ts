import { Factory, Inject, Singleton } from 'typescript-ioc';
import { DBState } from '../entity/DBState'
import { getUnixEpochTimestamp } from '../utils/utils';


import { DatabaseService } from '../services/DatabaseService';

export interface HealthStatus {
   lastProcessedBlock: number;
   currentBlock: number;
   currentBlockUpdateTimestamp: number;
   healthy: boolean;
}

@Singleton
@Factory(() => new StatusEngine())
export class StatusEngine {
   @Inject
   dbService: DatabaseService;

   public async getHealthStatus(): Promise<HealthStatus> {
      const lastProcessedBlockState = await this.dbService.manager.findOne(DBState, { where: { name: 'lastProcessedBlock' } });
      const currentBlockState = await this.dbService.manager.findOne(DBState, { where: { name: 'currentBlockNumber' } });
      if (lastProcessedBlockState && currentBlockState) {
         const lastProcessedBlock = lastProcessedBlockState.valueNumber;
         const currentBlock = currentBlockState.valueNumber;
         const currentBlockUpdateTimestamp = currentBlockState.timestamp;
         let healthy = false;
         if (lastProcessedBlock + 1 >= currentBlock && currentBlockUpdateTimestamp + 180 >= getUnixEpochTimestamp()) {
            healthy = true;
         }
         return {
            lastProcessedBlock: lastProcessedBlock,
            currentBlock: currentBlock,
            currentBlockUpdateTimestamp: currentBlockUpdateTimestamp,
            healthy: healthy
         };
      }

      return { lastProcessedBlock: 0, currentBlock: 0, currentBlockUpdateTimestamp: 0, healthy: false };
   }
}


