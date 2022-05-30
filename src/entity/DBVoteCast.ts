import { Column, Entity, Index } from "typeorm";
import { toBN, toHex } from "../utils/utils";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "vote_cast" })
export class DBVoteCast extends BaseEntity {
   @Column({ nullable: false }) @Index() voter: string;
   @Column({ nullable: false }) @Index() proposalId: string;
   @Column({ nullable: false }) @Index() support: number;
   @Column({ nullable: false }) @Index() weight: string; // padded hex string of uint256
   @Column({ type: "double", nullable: false }) @Index() weightFloat: number; // approximate vote power allowing for aggregations
   @Column({ nullable: false }) @Index() reason: string;

   static fromEvent(event: any): DBVoteCast {
      const entity = new DBVoteCast();
      let params = event.returnValues;
      entity.voter = toHex(params.voter);
      entity.proposalId = toHex(toBN(params.proposalId), 32);
      entity.support = parseInt(params.support);
      entity.weight = toHex(toBN(params.weight), 32);
      entity.weightFloat = parseFloat(params.weight);
      entity.reason = params.reason;
      return entity;
   }  
}

// event VoteCast(
//    address indexed voter,
//    uint256 proposalId,
//    uint8 support,
//    uint256 weight,
//    string reason
// );
