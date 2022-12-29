import { Column, Entity, Index } from 'typeorm';
import { ApiProvider, Provider } from '../dto/FtsoProvider';
import { BaseEntity } from './BaseEntity';


@Entity({ name: 'ftso_provider' })
export class DBFtsoProvider extends BaseEntity {
   @Column({ nullable: false }) @Index() chainId: number;
   @Column({ nullable: false }) name: string;
   @Column({ nullable: false }) @Index() address: string;
   @Column({ nullable: true, type: 'text' }) description?: string;
   @Column({ nullable: true }) url: string;
   @Column({ nullable: true }) logoURI?: string;
   @Column({ nullable: true }) listed?: boolean;


   static fromApi(provider: Provider, chainId: number): DBFtsoProvider {
      const entity = new DBFtsoProvider();
      entity.chainId = chainId;
      entity.name = provider.name;
      entity.description = provider.description;
      entity.url = provider.url;
      entity.address = provider.address;
      entity.logoURI = provider.logoURI;
      entity.listed = provider.listed;
      return entity;
   }

   updateFromApi(provider: Provider): boolean {
      let changed = false;

      if (this.name !== provider.name) {
         this.name = provider.name;
         changed = true;
      }
      if (this.description !== provider.description) {
         this.description = provider.description;
         changed = true;
      }
      if (this.url !== provider.url) {
         this.url = provider.url;
         changed = true;
      }
      if (this.address !== provider.address) {
         this.address = provider.address;
         changed = true;
      }
      if (this.logoURI !== provider.logoURI) {
         this.logoURI = provider.logoURI;
         changed = true;
      }
      if (this.listed !== provider.listed) {
         this.listed = provider.listed;
         changed = true;
      }
      return changed;
   }

   public toDTO(): Provider {
      return {
         chainId: this.chainId,
         name: this.name,
         description: this.description,
         url: this.url,
         address: this.address,
         logoURI: this.logoURI,
         listed: this.listed
      };
   }

   public toApi(): ApiProvider {
      return {
         name: this.name,
         address: this.address,
      };
   }

}
