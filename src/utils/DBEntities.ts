import { DBProposal } from "../entity/DBProposal";
import { DBVoteCast } from "../entity/DBVoteCast";

export class DBEntities {
   public proposals: DBProposal[] = [];
   public castedVotes: DBVoteCast[] = [];
   public refreshProposalIds: string[] = [];
}
