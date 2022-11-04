import { VoteCast } from '../../typechain-web3-v1/PollingFoundation';
import { DBProposal } from '../entity/DBProposal';
import { DBVote } from '../entity/DBVote';


export class VoteResult {
   constructor(readonly proposalId: string,
               readonly newFor: string,
               readonly newAgainst: string) {
   }

   static fromEvent(event: VoteCast): VoteResult {
      const params = event.returnValues;
      return new VoteResult(params.proposalId, params.forVotePower, params.againstVotePower);
   }
}

export class DBEntities {
   public proposals: DBProposal[] = [];
   public castedVotes: DBVote[] = [];
   public voteResults: VoteResult[] = [];
   public executedProposalIds: string[] = [];
   public canceledProposalIds: string[] = [];
}

