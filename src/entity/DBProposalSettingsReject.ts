import { Column, Entity, Index } from "typeorm";
import { toBN, toHex } from "../utils/utils";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "proposal_settings_reject" })
export class DBProposalSettingsReject extends BaseEntity {
   @Column({ nullable: false }) @Index() proposalId: string;
   @Column({ nullable: false }) @Index() votePowerBlock: number;
   @Column({ nullable: false }) @Index() quorumThreshold: string; // padded hex string of uint256
   @Column({ nullable: false }) @Index() rejectionThreshold: string; // padded hex string ouf uint256

   static fromEvent(event: any): DBProposalSettingsReject {
      const entity = new DBProposalSettingsReject();
      let params = event.returnValues;
      entity.proposalId = toHex(toBN(params.proposalId), 32);
      entity.votePowerBlock = parseInt(params.votePowerBlock);
      entity.quorumThreshold = toHex(toBN(params.quorumThreshold), 32);
      entity.rejectionThreshold = toHex(toBN(params.rejectionThreshold), 32);
      return entity;
   }

}

// event ProposalSettingsReject(
//    uint256 proposalId,
//    uint256 votePowerBlock,
//    uint256 quorumThreshold,
//    uint256 rejectionThreshold
// );
