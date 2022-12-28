import { Factory, Inject, Singleton } from 'typescript-ioc';
import { ConfigurationService } from './ConfigurationService';
import { DatabaseService } from './DatabaseService';
import { LoggerService } from './LoggerService';

@Singleton
@Factory(() => new FtsoService())
export class FtsoService {
   @Inject
   configurationService: ConfigurationService;

   @Inject
   dbService: DatabaseService;

   @Inject
   loggerService: LoggerService;

   constructor() {
      void this.init();
   }

   async init() {
      await this.dbService.waitForDBConnection();
      
   }

}

