import axios from 'axios';
import { Factory, Inject, Singleton } from 'typescript-ioc';
import { ConfigurationService } from '../services/ConfigurationService';
import { DatabaseService } from '../services/DatabaseService';
import { LoggerService } from '../services/LoggerService';
import { ApiProvider, BifrostWalletProviders, Provider } from '../dto/FtsoProvider'
import { DBFtsoProvider, FtsoProviderStatus } from '../entity/DBFtsoProvider';
import { logException } from '../logger/logger';

@Singleton
@Factory(() => new FtsoEngine())
export class FtsoEngine {
   @Inject
   configurationService: ConfigurationService;

   @Inject
   dbService: DatabaseService;

   @Inject
   loggerService: LoggerService;

   constructor() {
   }

   public async getAllProviders(): Promise<ApiProvider[]> {
      await this.dbService.waitForDBConnection();

      const query = this.dbService.connection.manager
         .createQueryBuilder(DBFtsoProvider, 'provider')
         .where('provider.status = :status', { status: FtsoProviderStatus.ACTIVE })
         .select(['provider.name', 'provider.address']);
      const dbProviders = await query.getMany();
      return dbProviders.map(p => p.toApi())
   }

   // Refresh Ftso providers from Towo url
   // Note: Shall we delete providers which do not exist anymore or use listed column
   async refreshFromUrl(url: string) {
      if (!url) {
         // Skip if no url specified
         return;
      }

      await this.dbService.waitForDBConnection();

      let urlProviders: Provider[] = [];
      try {
         const response = await axios.get<BifrostWalletProviders>(url);
         if (!response.data?.providers) {
            this.loggerService.logger.warn(`Got no FTSO providers at "${url}"`)
            return;
         }
         urlProviders = response.data.providers;
      } catch (error: any) {
         logException(error, `Error accessing FTSO providers list at "${url}"`);
      }

      const query = this.dbService.connection.manager
         .createQueryBuilder(DBFtsoProvider, 'provider')
         .where('provider.status = :status', { status: FtsoProviderStatus.ACTIVE })
         .andWhere('provider.chainId = :chainId', { chainId: this.configurationService.chainId })
         .select(['provider.address']);
      const currentProviders = await query.getMany();
      const currentAddresses = new Set(currentProviders.map(p => p.address));
      const newProviders: DBFtsoProvider[] = [];

      for (const p of urlProviders) {
         if (p.chainId === this.configurationService.chainId && !currentAddresses.has(p.address)) {
            newProviders.push(DBFtsoProvider.fromApi(p, this.configurationService.chainId));
         }
      }
      await this.dbService.manager.save(newProviders);
   }

}

