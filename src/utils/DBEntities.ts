import { DBProposal } from '../entity/DBProposal';
import { DBVote } from '../entity/DBVote';

export class DBEntities {
   public proposals: DBProposal[] = [];
   public castedVotes: DBVote[] = [];
   public refreshProposalIds: string[] = [];
}
