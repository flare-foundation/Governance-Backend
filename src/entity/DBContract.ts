import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ContractDeploy } from '../utils/interfaces';

@Entity({ name: 'contract' })
export class DBContract {
  /**
   * Auto incremented id
   */
   @PrimaryGeneratedColumn({ type: "int" })
   id: number;
   @Column({}) name: string;
   @Column({ nullable: false }) @Index() chainId: number;
   @Column({ nullable: false }) @Index() contractName: string;
   @Column({ nullable: false }) @Index() address: string;

   static fromData(deployData: ContractDeploy, chainId: number): DBContract {
      const entity = new DBContract();
      entity.chainId = chainId;
      entity.name = deployData.name;
      entity.contractName = deployData.contractName;
      entity.address = deployData.address;
      return entity;
   }
}
