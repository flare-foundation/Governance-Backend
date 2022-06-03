import { Controller, Get, Path, Query, Route, Tags } from "tsoa";
import { Factory, Inject, Singleton } from "typescript-ioc";
import { ApiResponse, handleApiResponse } from "../dto/generic/ApiResponse";
import { PaginatedList } from "../dto/generic/PaginatedList";
import { SortType } from "../dto/generic/PaginationRequest";
import { PollingContractType, Proposal } from "../dto/Proposal";
import { GovernanceEngine, ProposalSortType } from "../engines/governanceEngine";
import { ContractDeploy } from "../utils/interfaces";

@Tags('Governance')
@Route("api/governance")
@Singleton
@Factory(() => new GovernanceController())
export class GovernanceController extends Controller {

   @Inject
   private governanceEngine: GovernanceEngine;

   constructor() {
      super();
   }
   
   @Get("proposals/list")
   public async getProposalList(
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
      @Query() maxEndTime?: number
   ): Promise<ApiResponse<PaginatedList<Proposal>>> {
      return handleApiResponse(
         this.governanceEngine.getProposalList({limit, offset, sort, sortBy, pollingContractType, contract, description, minStartTime, maxStartTime, minEndTime, maxEndTime})
      )
   }

   @Get("proposals/{proposalId}")
   public async getProposalById(
      @Path() proposalId: string
   ): Promise<ApiResponse<Proposal>> {
      return handleApiResponse(
         this.governanceEngine.getProposalById(proposalId)
      )
   }

   @Get("deployed-contract-data")
   public async deployedContractData(
   ): Promise<ApiResponse<ContractDeploy[]>> {
      return handleApiResponse(
         this.governanceEngine.deployedContractData()
      )
   }

}