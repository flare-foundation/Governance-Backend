import { Controller, Get, Path, Query, Route, Tags, SuccessResponse, Response } from 'tsoa';
import { Factory, Inject, Singleton } from 'typescript-ioc';
import { ApiResponse } from '../dto/generic/ApiResponse';
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

      return {lastProcessedBlock: 0, currentBlock: 0, currentBlockUpdateTimestamp: 0, healthy: false};
   }
}


@Tags('HealthCheck')
@Route('api/health')
@Singleton
@Factory(() => new HealthCheckController())
export class HealthCheckController extends Controller {
   @Inject
   private statusEngine: StatusEngine;

   constructor() {
      super();
   }

   @Get('status')
   @SuccessResponse('200', 'OK')
   @Response('500', 'error')
   public async getHealthCheck(): Promise<ApiResponse<HealthStatus>> {
      const healthStatus = this.statusEngine.getHealthStatus();
      if ((await healthStatus).healthy) {
         return healthStatus.then(
            (resp: HealthStatus) => new ApiResponse<HealthStatus>(resp)
         )
      } else {
         this.setStatus(500);
         return healthStatus.then(
            (resp: HealthStatus) => new ApiResponse<HealthStatus>(resp, 'ERROR')
         )
      }
   }

}
