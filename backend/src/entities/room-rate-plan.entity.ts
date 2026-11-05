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
import { RoomType } from "./room-type.entity";

@Entity("room_rate_plans")
@Index(["roomTypeId", "code"], { unique: true })
export class RoomRatePlan {
  @PrimaryGeneratedColumn("uuid", { name: "rate_plan_id" })
  ratePlanId!: string;

  @Column({ name: "room_type_id", type: "uuid" })
  roomTypeId!: string;

  @ManyToOne(() => RoomType, (roomType) => roomType.ratePlans, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "room_type_id" })
  roomType!: RoomType;

  @Column({ type: "varchar", length: 30 })
  code!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ name: "default_check_in_time", type: "time", nullable: true })
  defaultCheckInTime!: string | null;

  @Column({ name: "default_check_out_time", type: "time", nullable: true })
  defaultCheckOutTime!: string | null;

  @Column({ name: "reset_time", type: "time", nullable: true })
  resetTime!: string | null;

  @Column({ name: "check_in_grace_minutes", type: "int", default: 0 })
  checkInGraceMinutes!: number;

  @Column({ name: "check_out_grace_minutes", type: "int", default: 0 })
  checkOutGraceMinutes!: number;

  @Column({ name: "rounding_minutes", type: "int", default: 60 })
  roundingMinutes!: number;

  @Column({ name: "valid_from", type: "date", nullable: true })
  validFrom!: string | null;

  @Column({ name: "valid_to", type: "date", nullable: true })
  validTo!: string | null;

  @Column({ name: "is_default", type: "boolean", default: false })
  isDefault!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
