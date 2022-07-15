import { Factory, Inject, Singleton } from "typescript-ioc";
import Web3 from "web3";
import {
  getWeb3
} from "../utils/utils";
import { ConfigurationService } from "./ConfigurationService";
import { LoggerService } from "./LoggerService";

@Singleton
@Factory(() => new NetworkService())
export class NetworkService {
  @Inject
  configurationService: ConfigurationService;

  @Inject
  loggerService: LoggerService;

  constructor() {
    this.init();
  }

  initialized = false;

  public web3: Web3;

  async init() {
    this.web3 = getWeb3(
      this.configurationService.networkRPC,
      this.loggerService.logger
    );
    this.initialized = true;
  }

  public async getBlockTimestamp(
    blockNumber: number
  ): Promise<number> {
    const elem = await this.web3.eth.getBlock(blockNumber);
    let blockTs = elem?.timestamp || 0;
    if (typeof blockTs === "string") {
      blockTs = parseInt(blockTs);
    }
    return blockTs;
  }
}
