import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CustomerIdentity } from "./customer-identity.entity";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid", { name: "customer_id" })
  customerId!: string;

  @Column({ name: "full_name", length: 150, nullable: true })
  fullName!: string | null;

  @Column({ length: 30, nullable: true })
  phone!: string | null;

  @Column({ length: 150, nullable: true })
  email!: string | null;

  @Column({ length: 80, default: "Vietnam" })
  nationality!: string;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => CustomerIdentity, (identity) => identity.customer)
  identities!: CustomerIdentity[];
}
