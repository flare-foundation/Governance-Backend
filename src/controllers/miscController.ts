import { Controller, Get, Route, Tags } from 'tsoa';
import { Factory, Inject, Singleton } from 'typescript-ioc';
import { ApiProvider } from '../dto/FtsoProvider';
import { ApiResponse, handleApiResponse } from '../dto/generic/ApiResponse';
import { FtsoEngine } from '../engines/ftsoEngine';
import { ConfigurationService } from '../services/ConfigurationService';

@Tags('Misc services')
@Route('api/misc')
@Singleton
@Factory(() => new MiscController())
export class MiscController extends Controller {
   @Inject
   configurationService: ConfigurationService;

   @Inject
   ftsoEngine: FtsoEngine;

   constructor() {
      super();
   }

   @Get('ftso/list')
   public async getFtsoProviders(): Promise<ApiResponse<ApiProvider[]>> {
      return handleApiResponse(this.ftsoEngine.getAllProviders());
   }

}
