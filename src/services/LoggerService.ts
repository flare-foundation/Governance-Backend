import { Factory, Singleton } from "typescript-ioc";
import { getGlobalLogger } from "../logger/logger";

@Singleton
@Factory(() => new LoggerService())
export class LoggerService {
   public logger = getGlobalLogger();
}