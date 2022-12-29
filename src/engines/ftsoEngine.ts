import axios from 'axios';
import { Factory, Inject, Singleton } from 'typescript-ioc';
import { ConfigurationService } from '../services/ConfigurationService';
import { DatabaseService } from '../services/DatabaseService';
import { LoggerService } from '../services/LoggerService';
import { ApiProvider, BifrostWalletProviders, Provider } from '../dto/FtsoProvider'
import { DBFtsoProvider } from '../entity/DBFtsoProvider';
import { logException } from '../logger/logger';
import { CronJob } from 'cron';
import { Mutex } from 'async-mutex';

@Singleton
@Factory(() => new FtsoEngine())
export class FtsoEngine {
   @Inject
   configurationService: ConfigurationService;

   @Inject
   dbService: DatabaseService;

   @Inject
   loggerService: LoggerService;

   private cronJob: CronJob;

   refreshLock = new Mutex();

   constructor() {
   }

   public init() {
      if (this.configurationService.ftsoProvidersCronString) {
         this.cronJob = new CronJob({
            cronTime: this.configurationService.ftsoProvidersCronString,
            onTick: () => { void this.refreshMutex(); },
            runOnInit: true,
         });
         this.cronJob.start();
      } else {
         this.loggerService.logger.warn('Cronjob string was not specified for FTSO provider update');
      }
   }

   public async getAllProviders(): Promise<ApiProvider[]> {
      await this.dbService.waitForDBConnection();

      const query = this.dbService.connection.manager
         .createQueryBuilder(DBFtsoProvider, 'provider')
         .andWhere('provider.listed = :listed', { listed: true })
         .select(['provider.name', 'provider.address']);
      const dbProviders = await query.getMany();
      return dbProviders.map(p => p.toApi())
   }

   // Refresh Ftso providers from "Towo" url; pay attention that refresh() is not
   // called twice at the same time
   private async refreshMutex() {
      const release = await this.refreshLock.acquire();
      try {
         await this.refresh();
      } catch (error: any) {
         logException(error, 'Error updating FTSO providers list');
      } finally {
         release();
      }
   }

   // Refresh Ftso providers from "Towo" url
   private async refresh() {
      const url = this.configurationService.ftsoProvidersUrl;
      if (!url) {
         this.loggerService.logger.warn('Updating FTSO providers but no url was specified');
         // Skip if no url specified
         return;
      }

      await this.dbService.waitForDBConnection();

      this.loggerService.logger.info(`Updating FTSO providers from ${url}`);

      const chainId = this.configurationService.chainId;
      let urlProviders: Provider[] = [];

      const response = await axios.get<BifrostWalletProviders>(url);
      if (!response.data?.providers) {
         this.loggerService.logger.warn(`Got no FTSO providers at "${url}"`)
         return;
      }
      urlProviders = response.data.providers;

      const query = this.dbService.connection.manager
         .createQueryBuilder(DBFtsoProvider, 'provider')
         .andWhere('provider.chainId = :chainId', { chainId });
      const currentProviders = await query.getMany();

      const currentProvidersMap = new Map<string, DBFtsoProvider>();
      for (const p of currentProviders) {
         currentProvidersMap.set(p.address, p)
      }

      const providersToUpdate: DBFtsoProvider[] = [];
      const urlProvidersAddresses = new Set<string>();
      for (const p of urlProviders) {
         if (p.chainId !== chainId) {
            continue;
         }
         const cp = currentProvidersMap.get(p.address);
         if (!cp) {
            providersToUpdate.push(DBFtsoProvider.fromApi(p, chainId));
         } else if (cp.updateFromApi(p)) {
            providersToUpdate.push(cp);
         }
         urlProvidersAddresses.add(p.address);
      }

      const providersToRemove: DBFtsoProvider[] = [];
      for (const cp of currentProviders) {
         if (!urlProvidersAddresses.has(cp.address)) {
            providersToRemove.push(cp);
         }
      }

      if (providersToUpdate.length > 0) {
         await this.dbService.manager.save(providersToUpdate);
      }
      if (providersToRemove.length > 0) {
         await this.dbService.manager.remove(providersToRemove);
      }
   }

}
