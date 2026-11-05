import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { RoomStay } from "./room-stay.entity";

@Entity("room_stay_charges")
@Index(["stayId"], { unique: true })
export class RoomStayCharge {
  @PrimaryGeneratedColumn("uuid", { name: "charge_id" })
  chargeId!: string;

  @Column({ name: "stay_id", type: "uuid" })
  stayId!: string;

  @OneToOne(() => RoomStay, (roomStay) => roomStay.charge, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "stay_id" })
  roomStay!: RoomStay;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: "jsonb", nullable: true })
  snapshot!: Record<string, unknown> | null;

  @Column({ name: "is_paid", type: "boolean", default: false })
  isPaid!: boolean;

  @Column({ name: "payment_method", type: "varchar", length: 20, default: "cash" })
  paymentMethod!: string;

  @Column({ name: "paid_at", type: "timestamptz", nullable: true })
  paidAt!: Date | null;

  @Column({ name: "paid_by_user_id", type: "uuid", nullable: true })
  paidByUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "paid_by_user_id" })
  paidByUser!: User | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
