import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "./customer.entity";

@Entity("customer_identities")
@Index(["identityType", "identityNumber"], { unique: true })
export class CustomerIdentity {
  @PrimaryGeneratedColumn("uuid", { name: "identity_id" })
  identityId!: string;

  @Column({ name: "customer_id", type: "uuid" })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.identities, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;

  @Column({ name: "identity_type", type: "varchar", length: 30, default: "citizen_id" })
  identityType!: string;

  @Column({ name: "identity_number", type: "varchar", length: 50 })
  identityNumber!: string;

  @Column({ name: "name_on_document", type: "varchar", length: 150, nullable: true })
  nameOnDocument!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  nationality!: string | null;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth!: string | null;

  @Column({ name: "issued_date", type: "date", nullable: true })
  issuedDate!: string | null;

  @Column({ name: "expiry_date", type: "date", nullable: true })
  expiryDate!: string | null;

  @Column({ type: "varchar", length: 20, default: "active" })
  status!: string;

  @Column({ name: "replaced_by_identity_id", type: "uuid", nullable: true })
  replacedByIdentityId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
