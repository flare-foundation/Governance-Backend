import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "./BaseEntity";

@Entity({ name: "user_comment" })
export class UserComment extends BaseEntity {
   @Column({ nullable: true }) @Index() name: string;
   @Column({ nullable: true }) @Index() message: string;
}
