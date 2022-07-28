import { Column, Entity, Index } from 'typeorm';
import { Vote } from '../dto/Vote';
import { toBN, toHex } from '../utils/utils';
import { BaseEntity } from './BaseEntity';

@Entity({ name: 'vote' })
export class DBVote extends BaseEntity {
   @Column({ nullable: false }) @Index() chainId: number;
   @Column({ nullable: false }) @Index() voter: string;
   @Column({ nullable: false }) @Index() proposalId: string;
   @Column({ nullable: false }) @Index() support: number;
   @Column({ nullable: false }) @Index() weight: string; // padded hex string of uint256
   @Column({ type: 'double', nullable: false }) @Index() weightFloat: number; // approximate vote power allowing for aggregations
   @Column({ nullable: false }) @Index() reason: string;

   static fromEvent(event: any, chainId: number): DBVote {
      const entity = new DBVote();
      let params = event.returnValues;
      entity.chainId = chainId;
      entity.voter = toHex(params.voter);
      entity.proposalId = params.proposalId;
      entity.support = parseInt(params.support);
      entity.weight = toHex(toBN(params.weight), 32);
      entity.weightFloat = parseFloat(params.weight);
      entity.reason = params.reason;
      return entity;
   }

   public toDTO(): Vote {
      return {
         voter: this.voter,
         proposalId: this.proposalId,
         chainId: this.chainId,
         support: this.support,
         weight: this.weight,
         weightFloat: this.weightFloat,
         reason: this.reason,
      };
   }
}

// event VoteCast(
//    address indexed voter,
//    uint256 proposalId,
//    uint8 support,
//    uint256 weight,
//    string reason
// );
