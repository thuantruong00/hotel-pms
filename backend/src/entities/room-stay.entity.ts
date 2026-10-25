import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Customer } from "./customer.entity";
import { RoomRatePlan } from "./room-rate-plan.entity";
import { Room } from "./room.entity";
import { RoomStayCharge } from "./room-stay-charge.entity";
import { User } from "./user.entity";
import { WorkSession } from "./work-session.entity";

@Entity("room_stays")
@Index(["roomId", "status"])
@Index(["customerId", "createdAt"])
export class RoomStay {
  @PrimaryGeneratedColumn("uuid", { name: "stay_id" })
  stayId!: string;

  @Column({ name: "room_id" })
  roomId!: string;

  @ManyToOne(() => Room, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @Column({ name: "customer_id", nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer | null;

  @Column({ name: "created_by_user_id", nullable: true })
  createdByUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by_user_id" })
  createdByUser!: User | null;

  @Column({ name: "session_id", nullable: true })
  sessionId!: string | null;

  @ManyToOne(() => WorkSession, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "session_id" })
  session!: WorkSession | null;

  @Column({ name: "rate_plan_id", nullable: true })
  ratePlanId!: string | null;

  @ManyToOne(() => RoomRatePlan, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "rate_plan_id" })
  ratePlan!: RoomRatePlan | null;

  @Column({ name: "check_in_at", type: "timestamptz" })
  checkInAt!: Date;

  @Column({ name: "expected_check_out_at", type: "timestamptz", nullable: true })
  expectedCheckOutAt!: Date | null;

  @Column({ name: "actual_check_out_at", type: "timestamptz", nullable: true })
  actualCheckOutAt!: Date | null;

  @Column({ type: "int", default: 1 })
  guestCount!: number;

  @Column({ length: 20, default: "active" })
  status!: string;

  @Column({ name: "room_amount", type: "numeric", precision: 12, scale: 2, default: 0 })
  roomAmount!: string;

  @Column({ name: "product_amount", type: "numeric", precision: 12, scale: 2, default: 0 })
  productAmount!: string;

  @Column({ name: "discount_amount", type: "numeric", precision: 12, scale: 2, default: 0 })
  discountAmount!: string;

  @Column({ name: "surcharge_amount", type: "numeric", precision: 12, scale: 2, default: 0 })
  surchargeAmount!: string;

  @Column({ name: "penalty_amount", type: "numeric", precision: 12, scale: 2, default: 0 })
  penaltyAmount!: string;

  @Column({ name: "penalty_reason", type: "text", nullable: true })
  penaltyReason!: string | null;

  @Column({ name: "total_amount", type: "numeric", precision: 12, scale: 2, default: 0 })
  totalAmount!: string;

  @Column({ name: "payment_method", length: 20, nullable: true })
  paymentMethod!: string | null;

  @Column({ name: "payment_status", length: 20, default: "unpaid" })
  paymentStatus!: string;

  @Column({ name: "paid_at", type: "timestamptz", nullable: true })
  paidAt!: Date | null;

  @Column({ name: "paid_by_user_id", nullable: true })
  paidByUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "paid_by_user_id" })
  paidByUser!: User | null;

  @OneToMany(() => RoomStayCharge, (charge) => charge.roomStay)
  charges!: RoomStayCharge[];

  @Column({ name: "calculated_at", type: "timestamptz", nullable: true })
  calculatedAt!: Date | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
