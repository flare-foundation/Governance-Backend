import { Controller, Get, Route, Tags, SuccessResponse, Response } from 'tsoa';
import { Factory, Inject, Singleton } from 'typescript-ioc';
import { ApiResponse } from '../dto/generic/ApiResponse';
import { HealthStatus, StatusEngine } from '../engines/statusEngine';

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
