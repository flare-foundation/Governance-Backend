import { Factory, Singleton } from "typescript-ioc";

export interface DatabaseConnectOptions {
   type: string;
   host: string;
   port: number;
   database: string;
   username: string;
   password: string;
}

export interface WebServerOptions {
   port: number;
}

@Singleton
@Factory(() => new ConfigurationService())
export class ConfigurationService {   

   // should be set on the start-up of the service once (global constant)
   public static network = "";
   
   networkRPC = process.env.RPC;

   databaseConnectOptions = {
      type: process.env.DB_TYPE,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD
   }

   webServerOptions = {
      port: parseInt(process.env.WEB_SERVER_PORT),
   }

}
