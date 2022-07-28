export enum VoteType {
   Against = 0,
   For = 1,
   Abstain = 2,
}

export enum ProposalState {
   Pending = 0,
   Active = 1,
   Defeated = 2,
   Succeeded = 3,
   Queued = 4,
   Expired = 5,
   Executed = 6,
}

export enum ProposalStateOptions {
   Pending = 'Pending',
   Active = 'Active',
   Defeated = 'Defeated',
   Succeeded = 'Succeeded',
   Queued = 'Queued',
   Expired = 'Expired',
   Executed = 'Executed',
}

export enum ProposalVotingStatus {
   Pending = 'Pending',
   Active = 'Active',
   Defeated = 'Defeated',
   Succeeded = 'Succeeded',
}
