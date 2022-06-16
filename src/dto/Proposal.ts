import { ProposalStateOptions, ProposalVotingStatus } from "../utils/enums";

export type PollingContractType = "accept" | "reject"
export interface Proposal {
   contract: string;
   pollingType: PollingContractType,
   proposalId: string;
   proposer: string;
   targets: string[];
   values: string[];
   signatures: string[];
   calldatas: string[];
   startTime: number;
   endTime: number;
   description: string;
   votePowerBlock: number;
   wrappingThreshold: number;
   absoluteThreshold: number;
   relativeThreshold: number;
   execStartTime: number;
   execEndTime: number;
   totalVotePower: string;
   executableOnChain: boolean;
   executed: boolean;
   for: string;
   against: string;
   abstain: string;
   status: ProposalVotingStatus;
   voterAddress?: string;
   voterVotePower?: string;
}
