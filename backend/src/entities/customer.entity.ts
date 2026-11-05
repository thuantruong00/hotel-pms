import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CustomerIdentity } from "./customer-identity.entity";
import { RoomStayCustomer } from "./room-stay-customer.entity";

@Entity("customers")
export class Customer {
  @PrimaryGeneratedColumn("uuid", { name: "customer_id" })
  customerId!: string;

  @Column({ name: "full_name", type: "varchar", length: 150, nullable: true })
  fullName!: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 150, nullable: true })
  email!: string | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => CustomerIdentity, (identity) => identity.customer)
  identities!: CustomerIdentity[];

  @OneToMany(() => RoomStayCustomer, (stayCustomer) => stayCustomer.customer)
  roomStayLinks!: RoomStayCustomer[];
}
