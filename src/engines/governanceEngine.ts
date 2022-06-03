import { Factory, Inject, Singleton } from "typescript-ioc";
import { PaginatedList } from "../dto/generic/PaginatedList";
import { PaginationRequest, SortType } from "../dto/generic/PaginationRequest";
import { PollingContractType, Proposal } from "../dto/Proposal";
import { DBProposal } from "../entity/DBProposal";
import { ContractService } from "../services/ContractService";
import { ContractDeploy } from "../utils/interfaces";
import { DatabaseService } from "../services/DatabaseService";

export interface ProposalPaginationRequest extends PaginationRequest {
   contract?: string;
   pollingContractType?: PollingContractType,
   description?: string,
   minStartTime?: number,
   maxStartTime?: number,
   minEndTime?: number,
   maxEndTime?: number
}

// These should be synced!
export type ProposalSortType = "startTime" | "endTime" | "votePowerBlock" | "contract" | "proposalId" | "pollingType" | "description";
const PROPOSAL_LEGIT_SORT_TYPES = ["startTime", "endTime", "votePowerBlock", "contract", "proposalId", "pollingType", "description"];
const PROPOSAL_MAX_LIMIT = 100;

@Singleton
@Factory(() => new GovernanceEngine())
export class GovernanceEngine {

   @Inject
   dbService: DatabaseService;

   @Inject
   contractService: ContractService;


   public async getProposalById(proposalId: string): Promise<Proposal> {
      const repo = this.dbService.manager.getRepository(DBProposal)
      let result = await repo.find({ where: { proposalId } });
      if (result && result.length) {
         return result[0].toDTO();
      }
      return null;
   }

   public async getProposalList(options: ProposalPaginationRequest): Promise<PaginatedList<Proposal>> {
      let query = this.dbService.connection.manager.createQueryBuilder(DBProposal, "proposal");

      if (options.contract) {
         query = query.andWhere("proposal.contract = :contract", { contract: options.contract });
      }
      if (options.description) {
         query = query.andWhere("proposal.description like :desc", { desc: `%${options.description}%` });
      }
      if (options.pollingContractType) {
         query = query.andWhere("proposal.pollingType = :pollingContractType", { pollingContractType: options.pollingContractType });
      }
      if (options.minStartTime != null) {
         query = query.andWhere("proposal.startTime >= :minStartTime", { minStartTime: options.minStartTime });
      }
      if (options.maxStartTime != null) {
         query = query.andWhere("proposal.startTime <= :maxStartTime", { maxStartTime: options.maxStartTime });
      }
      if (options.minEndTime != null) {
         query = query.andWhere("proposal.endTime >= :minEndTime", { minEndTime: options.minEndTime });
      }
      if (options.maxEndTime != null) {
         query = query.andWhere("proposal.endTime <= :maxEndTime", { maxEndTime: options.maxEndTime });
      }
      if (options.sortBy && PROPOSAL_LEGIT_SORT_TYPES.indexOf(options.sortBy) >= 0) {
         // important verification due possible SQL injection!
         let order: SortType = options.sort === 'DESC' ? 'DESC' : 'ASC';
         query = query.orderBy(`proposal.${options.sortBy}`, order)
      }

      let count = await query.getCount();
      let limit = !options.limit || options.limit < 0 || options.limit > PROPOSAL_MAX_LIMIT ? PROPOSAL_MAX_LIMIT : options.limit;
      let offset = options.offset < 0 || !options.offset ? 0 : options.offset;

      query = query.limit(limit).offset(offset);

      let result = await query.getMany() as DBProposal[];
      return new PaginatedList<Proposal>(
         result.map(dbProp => dbProp.toDTO()),
         count,
         limit,
         offset
      )
   }

   public async deployedContractData(): Promise<ContractDeploy[]> {
      await this.dbService.waitForDBConnection();
      await this.contractService.waitForInitialization();
      return this.contractService.deployData;
   }
   
}
