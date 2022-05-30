import { Column, Entity, Index } from "typeorm";
import { toHex } from "../utils/utils";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "proposal_settings_accept" })
export class DBProposalSettingsAccept extends BaseEntity {
   @Column({ nullable: false }) @Index() proposalId: string;
   @Column({ nullable: false }) @Index() votePowerBlock: number;
   @Column({ nullable: false }) @Index() quorumThreshold: string;
   @Column({ nullable: false }) @Index() acceptanceThreshold: string;

   static fromEvent(event: any): DBProposalSettingsAccept {
      const entity = new DBProposalSettingsAccept();
      entity.proposalId = toHex(event.proposalId, 32);
      entity.votePowerBlock = event.votePowerBlock.toNumber();
      entity.quorumThreshold = toHex(event.quorumThreshold, 32);
      entity.acceptanceThreshold = toHex(event.acceptanceThreshold, 32);
      return entity;
   }

}

// event ProposalSettingsAccept(
//    uint256 proposalId,
//    uint256 votePowerBlock,
//    uint256 quorumThreshold,
//    uint256 acceptanceThreshold
// );
