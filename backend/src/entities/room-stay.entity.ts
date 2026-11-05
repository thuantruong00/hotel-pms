import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RoomRatePlan } from "./room-rate-plan.entity";
import { Room } from "./room.entity";
import { RoomStayCharge } from "./room-stay-charge.entity";
import { User } from "./user.entity";
import { WorkSession } from "./work-session.entity";
import { RoomStayCustomer } from "./room-stay-customer.entity";
import { RoomStayStatus } from "~/utils/enum";

@Entity("room_stays")
@Index(["roomId", "status"])
@Index(["roomId", "plannedCheckInAt", "plannedCheckOutAt"])
export class RoomStay {
  @PrimaryGeneratedColumn("uuid", { name: "stay_id" })
  stayId!: string;

  @Column({ name: "room_id", type: "uuid" })
  roomId!: string;

  @ManyToOne(() => Room, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "room_id" })
  room!: Room;

  @Column({ name: "created_by_user_id", type: "uuid", nullable: true })
  createdByUserId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "created_by_user_id" })
  createdByUser!: User | null;

  @Column({ name: "session_id", type: "uuid", nullable: true })
  sessionId!: string | null;

  @ManyToOne(() => WorkSession, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "session_id" })
  session!: WorkSession | null;

  @Column({ name: "rate_plan_id", type: "uuid", nullable: true })
  ratePlanId!: string | null;

  @ManyToOne(() => RoomRatePlan, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "rate_plan_id" })
  ratePlan!: RoomRatePlan | null;

  @Column({ name: "reservation_code", type: "varchar", length: 40, unique: true, nullable: true })
  reservationCode!: string | null;

  @Column({ name: "planned_check_in_at", type: "timestamptz" })
  plannedCheckInAt!: Date;

  @Column({ name: "planned_check_out_at", type: "timestamptz" })
  plannedCheckOutAt!: Date;

  @Column({ name: "actual_check_in_at", type: "timestamptz", nullable: true })
  actualCheckInAt!: Date | null;

  @Column({ name: "actual_check_out_at", type: "timestamptz", nullable: true })
  actualCheckOutAt!: Date | null;

  @Column({ type: "int", default: 1 })
  guestCount!: number;

  @Column({ type: "enum", enum: RoomStayStatus, default: RoomStayStatus.RESERVED })
  status!: RoomStayStatus;

  @Column({ name: "confirmed_at", type: "timestamptz", nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: "cancelled_at", type: "timestamptz", nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: "no_show_at", type: "timestamptz", nullable: true })
  noShowAt!: Date | null;

  @Column({ name: "room_amount", type: "numeric", precision: 12, scale: 2, default: 0 })
  roomAmount!: string;

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

  @OneToOne(() => RoomStayCharge, (charge) => charge.roomStay)
  charge!: RoomStayCharge | null;

  @OneToMany(() => RoomStayCustomer, (stayCustomer) => stayCustomer.stay)
  guests!: RoomStayCustomer[];

  @Column({ name: "calculated_at", type: "timestamptz", nullable: true })
  calculatedAt!: Date | null;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
