import { Column, Entity, Index } from "typeorm";
import { toHex } from "../utils/utils";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "state" })
export class DBProposalCreated extends BaseEntity {
   @Column({ nullable: false }) @Index() proposalId: string;
   @Column({ nullable: false }) @Index() proposer: string;
   @Column({ nullable: false }) targets: string;  // serialized array of hex values
   @Column({ nullable: false }) values: string;  // serialized array of hex values
   @Column({ nullable: false }) signatures: string; // serialized array of hex values
   @Column({ nullable: false }) calldatas: string; // serialized array of hex values
   @Column({ nullable: false }) @Index() startTime: number;
   @Column({ nullable: false }) @Index() endTime: number;
   @Column({ nullable: false }) description: string;

   static fromEvent(event: any): DBProposalCreated {
      const entity = new DBProposalCreated();
      entity.proposalId = toHex(event.proposalId, 32);
      entity.proposer = event.proposer;
      entity.targets = JSON.stringify(event.targets);
      entity.values = JSON.stringify(event.values.map(x => toHex(x, 32)));
      entity.signatures = JSON.stringify(event.signatures);
      entity.calldatas = JSON.stringify(event.calldatas);
      entity.startTime = event.startTime.toNumber();
      entity.endTime = event.endTime.toNumber();
      entity.description = event.description;
      return entity;
   }
}

// event ProposalCreated(
//    uint256 proposalId,
//    address proposer,
//    address[] targets,
//    uint256[] values,
//    string[] signatures,
//    bytes[] calldatas,
//    uint256 startTime,
//    uint256 endTime,
//    string description
// );



// event ProposalCanceled(uint256 proposalId);

// event ProposalExecuted(uint256 proposalId);


// event ProposalThresholdSet(uint256 oldProposalThreshold, uint256 newProposalThreshold);
// event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
// event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);
// event ExecutionDelaySet(uint256 oldExecutionDelay, uint256 newExecutionDelay);
// event ExecutionPeriodSet(uint256 oldExecutionPeriod, uint256 newExecutionPeriod);
// event QuorumThresholdSet(uint256 oldQuorumThreshold, uint256 newQuorumThreshold);
// event VotePowerLifeTimeDaysSet(uint256 oldVotePowerLifeTimeDays, uint256 newVotePowerLifeTimeDays);
// event VpBlockPeriodSecondsSet(uint256 oldVpBlockPeriodSeconds, uint256 newVpBlockPeriodSeconds);        
