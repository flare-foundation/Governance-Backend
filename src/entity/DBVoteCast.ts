import { Column, Entity, Index } from "typeorm";
import { toHex } from "../utils/utils";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "vote_cast" })
export class DBVoteCast extends BaseEntity {
   @Column({ nullable: false }) @Index() voter: string;
   @Column({ nullable: false }) @Index() proposalId: string;
   @Column({ nullable: false }) @Index() support: number;
   @Column({ nullable: false }) @Index() weightHex: string; // padded hex string of uint256
   @Column({ type: "double", nullable: false }) @Index() weight: number; // approximate vote power allowing for aggregations
   @Column({ nullable: false }) @Index() reason: string;

   static fromEvent(event: any): DBVoteCast {
      const entity = new DBVoteCast();
      entity.voter = toHex(event.voter);
      entity.proposalId = toHex(event.proposalId, 32);
      entity.support = event.support.toNumber();
      entity.weightHex = toHex(event.weight, 32);
      entity.weight = event.weight.toNumber();
      entity.reason = event.reason;
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
