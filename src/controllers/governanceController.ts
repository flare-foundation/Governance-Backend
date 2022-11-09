import { Controller, Get, Path, Query, Route, Tags } from 'tsoa';
import { Factory, Inject, Singleton } from 'typescript-ioc';
import { ApiResponse, handleApiResponse } from '../dto/generic/ApiResponse';
import { PaginatedList } from '../dto/generic/PaginatedList';
import { SortType } from '../dto/generic/PaginationRequest';
import { PollingContractType, Proposal } from '../dto/Proposal';
import { Vote } from '../dto/Vote';
import { GovernanceEngine, ProposalSortType, VoteSortType } from '../engines/governanceEngine';
import { ContractDeploy } from '../utils/interfaces';

@Tags('Governance')
@Route('api/governance')
@Singleton
@Factory(() => new GovernanceController())
export class GovernanceController extends Controller {
   @Inject
   private governanceEngine: GovernanceEngine;

   constructor() {
      super();
   }

   @Get('proposals/list')
   public async getProposalList(
      @Query() chainId?: number,
      @Query() limit?: number,
      @Query() offset?: number,
      @Query() sort?: SortType,
      @Query() sortBy?: ProposalSortType,
      @Query() pollingContractType?: PollingContractType,
      @Query() contract?: string,
      @Query() description?: string,
      @Query() minStartTime?: number,
      @Query() maxStartTime?: number,
      @Query() minEndTime?: number,
      @Query() maxEndTime?: number,
      @Query() canceled?: boolean,
   ): Promise<ApiResponse<PaginatedList<Proposal>>> {
      return handleApiResponse(
         this.governanceEngine.getProposalList({
            chainId,
            limit,
            offset,
            sort,
            sortBy,
            pollingContractType,
            contract,
            description,
            minStartTime,
            maxStartTime,
            minEndTime,
            maxEndTime,
            canceled,
         })
      );
   }

   @Get('proposals/{proposalId}')
   public async getProposalById(@Path() proposalId: string, @Query() voterAddress?: string): Promise<ApiResponse<Proposal>> {
      return handleApiResponse(this.governanceEngine.getProposalById(proposalId, voterAddress));
   }

   @Get('deployed-contract-data')
   public async deployedContractData(): Promise<ApiResponse<ContractDeploy[]>> {
      return handleApiResponse(this.governanceEngine.deployedContractData());
   }

   @Get('votes-for-proposal/{proposalId}')
   public async getVotesForProposal(
      @Path() proposalId: string,
      @Query() limit?: number,
      @Query() offset?: number,
      @Query() sort?: SortType,
      @Query() sortBy?: VoteSortType,
      @Query() voter?: string
   ): Promise<ApiResponse<PaginatedList<Vote>>> {
      return handleApiResponse(this.governanceEngine.getVotesForProposal({ proposalId, limit, offset, sort, sortBy, voter }));
   }
}
