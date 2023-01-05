import { Column, Entity, Index } from 'typeorm';
import { ProposalCreated } from '../../typechain-web3-v1/PollingFoundation';
import { Proposal, PollingContractType } from '../dto/Proposal';
import { ProposalStateOptions, ProposalVotingStatus } from '../utils/enums';
import { BIPS, toBN, toHex } from '../utils/utils';
import { BaseEntity } from './BaseEntity';

@Entity({ name: 'proposal' })
export class DBProposal extends BaseEntity {
   @Column({ nullable: false }) @Index() chainId: number;
   @Column({ nullable: false }) @Index() contract: string;
   @Column({ nullable: false, unique: true }) proposalId: string;
   @Column({ nullable: false }) @Index() pollingType: string; // PollingContractType
   @Column({ nullable: false }) @Index() proposer: string;
   @Column({ nullable: false }) targets: string; // serialized array of hex values
   @Column({ nullable: false }) values: string; // serialized array of hex values
   @Column({ nullable: false }) calldatas: string; // serialized array of hex values
   @Column({ nullable: false }) @Index() startTime: number;
   @Column({ nullable: false }) @Index() endTime: number;
   @Column({ nullable: false, type: 'text' }) description: string;
   @Column({ nullable: false }) @Index() votePowerBlock: number;
   @Column({ nullable: false }) votePowerBlockTs: number;
   @Column({ nullable: false }) absoluteThreshold: number;
   @Column({ nullable: false }) relativeThreshold: number;
   @Column({ nullable: false }) @Index() totalVotePower: string;
   @Column({ nullable: false }) @Index() execStartTime: number;
   @Column({ nullable: false }) @Index() execEndTime: number;
   @Column({ nullable: false }) executableOnChain: boolean;
   @Column({ nullable: false }) executed: boolean;
   @Column({ nullable: false }) canceled: boolean;
   @Column({ nullable: false }) @Index() for: string;  // hex padded to 32 bytes for easier comparing
   @Column({ nullable: false }) @Index() against: string;  // hex padded to 32 bytes for easier comparing

   static fromEvent(event: ProposalCreated, votePowerBlockTs: number, chainId: number): DBProposal {
      const entity = new DBProposal();
      let params = event.returnValues;
      entity.chainId = chainId;
      entity.contract = toHex(event.address);
      entity.pollingType = params.accept ? 'accept' : 'reject';
      entity.proposalId = params.proposalId;
      entity.proposer = params.proposer;
      entity.targets = JSON.stringify(params.targets);
      entity.values = JSON.stringify(params.values.map((x) => toHex(x, 32)));
      entity.calldatas = JSON.stringify(params.calldatas);
      entity.startTime = parseInt(params.voteTimes[0]);
      entity.endTime = parseInt(params.voteTimes[1]);
      entity.description = params.description;
      entity.votePowerBlock = parseInt(params.votePowerBlock);
      entity.votePowerBlockTs = votePowerBlockTs;
      entity.absoluteThreshold = parseInt(params.thresholdConditionBIPS);
      entity.relativeThreshold = parseInt(params.majorityConditionBIPS);
      entity.execStartTime = parseInt(params.executionTimes[0]);
      entity.execEndTime = parseInt(params.executionTimes[1]);
      entity.totalVotePower = params.circulatingSupply;
      entity.executableOnChain = false;
      entity.executed = false;
      entity.canceled = false;
      entity.for = toHex(0, 32);
      entity.against = toHex(0, 32);
      return entity;
   }

   // Update votes
   updateVotes(newFor: string, newAgainst: string) {
      if (newFor) {
         const newForHex = toHex(newFor, 32);
         if (newForHex > this.for) {
            this.for = newForHex;
         }
      }
      if (newAgainst) {
         const newAgainstHex = toHex(newAgainst, 32);
         if (newAgainstHex > this.against) {
            this.against = newAgainstHex;
         }
      }
   }

   /**
    * Method from PoolingAccept.sol indicating if proposal succeeded
    */
   acceptProposalSucceeded(): boolean {
      const forBN = toBN(this.for);
      const totalBN = forBN.add(toBN(this.against));
      if (totalBN.lt(toBN(this.absoluteThreshold).mul(toBN(this.totalVotePower)).div(toBN(BIPS)))) {
         return false;
      }
      if (
         forBN.lte(
            toBN(this.relativeThreshold)
               .mul(totalBN)
               .div(toBN(BIPS))
         )
      ) {
         return false;
      }
      return true;
   }

   /**
    * Method from PoolingReject.sol indicating if this succeeded
    */
   rejectProposalSucceeded(): boolean {
      const againstBN = toBN(this.against);
      const totalBN = toBN(this.for).add(againstBN);
      if (totalBN.lt(toBN(this.absoluteThreshold).mul(toBN(this.totalVotePower)).div(toBN(BIPS)))) {
         return true;
      }
      if (
         againstBN.lte(
            toBN(this.relativeThreshold)
               .mul(totalBN)
               .div(toBN(BIPS))
         )
      ) {
         return true;
      }
      return false;
   }

   /**
    * This method is just a js implementation of the method in governance
    */
   proposalStatus(): ProposalStateOptions {
      if (this.canceled) {
         return ProposalStateOptions.Canceled;
      }
      if (this.executed) {
         return ProposalStateOptions.Executed;
      }
      const now = Math.floor(Date.now() / 1000);

      if (this.startTime > now) {
         return ProposalStateOptions.Pending;
      }

      if (this.endTime > now) {
         return ProposalStateOptions.Active;
      }

      let succeeded = false;

      // status from PoolingAccept.sol
      if ((this.pollingType as PollingContractType) === 'accept') {
         succeeded = this.acceptProposalSucceeded();
      }

      //   status from PoolingReject.sol
      if ((this.pollingType as PollingContractType) === 'reject') {
         succeeded = this.rejectProposalSucceeded();
      }

      if (succeeded) {
         if (!this.executableOnChain) {
            return ProposalStateOptions.Queued;
         }
         if (this.execStartTime > now) {
            return ProposalStateOptions.Succeeded;
         }
         if (this.execEndTime > now) {
            return ProposalStateOptions.Queued;
         }
         return ProposalStateOptions.Expired;
      }

      return ProposalStateOptions.Defeated;
   }

   proposalVotingStatus(): ProposalVotingStatus {
      if (this.canceled) {
         return ProposalVotingStatus.Canceled;
      }

      const now = Math.floor(Date.now() / 1000);

      if (this.startTime > now) {
         return ProposalVotingStatus.Pending;
      }

      if (this.endTime > now) {
         return ProposalVotingStatus.Active;
      }

      let succeeded = false;

      // status from PoolingAccept.sol
      if ((this.pollingType as PollingContractType) === 'accept') {
         succeeded = this.acceptProposalSucceeded();
      }

      //   status from PoolingReject.sol
      if ((this.pollingType as PollingContractType) === 'reject') {
         succeeded = this.rejectProposalSucceeded();
      }

      if (succeeded) return ProposalVotingStatus.Succeeded;
      else return ProposalVotingStatus.Defeated;
   }

   public toDTO(voterAddress?: string, voterVotePower?: string): Proposal {
      return {
         chainId: this.chainId,
         contract: this.contract,
         pollingType: this.pollingType as PollingContractType,
         proposalId: this.proposalId,
         proposer: this.proposer,
         targets: JSON.parse(this.targets),
         values: JSON.parse(this.values),
         calldatas: JSON.parse(this.calldatas),
         startTime: this.startTime,
         endTime: this.endTime,
         description: this.description,
         votePowerBlock: {
            blockNumber: this.votePowerBlock,
            blockTs: this.votePowerBlockTs,
         },
         absoluteThreshold: this.absoluteThreshold,
         relativeThreshold: this.relativeThreshold,
         execStartTime: this.execStartTime,
         execEndTime: this.execEndTime,
         totalVotePower: this.totalVotePower,
         executableOnChain: this.executableOnChain,
         executed: this.executed,
         for: this.for,
         against: this.against,
         status: this.proposalVotingStatus(),
         voterAddress: voterAddress,
         voterVotePower: voterVotePower,
      };
   }
}
