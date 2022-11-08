import { ProposalVotingStatus } from '../utils/enums';

export type PollingContractType = 'accept' | 'reject';

export interface VotePowerBlock {
   blockNumber: number;
   blockTs: number;
}

export interface Proposal {
   chainId: number;
   contract: string;
   pollingType: PollingContractType;
   proposalId: string;
   proposer: string;
   targets: string[];
   values: string[];
   calldatas: string[];
   startTime: number;
   endTime: number;
   description: string;
   votePowerBlock: VotePowerBlock;
   absoluteThreshold: number;
   relativeThreshold: number;
   execStartTime: number;
   execEndTime: number;
   totalVotePower: string;
   executableOnChain: boolean;
   executed: boolean;
   for: string;
   against: string;
   status: ProposalVotingStatus;
   voterAddress?: string;
   voterVotePower?: string;
}
