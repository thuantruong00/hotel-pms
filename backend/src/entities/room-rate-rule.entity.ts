import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomRatePlan } from "./room-rate-plan.entity";
import { RoomType } from "./room-type.entity";
import { RoomRateRuleType } from "~/utils/enum";

@Entity("room_rate_rules")
@Index(["ratePlanId", "ruleType", "priority"])
export class RoomRateRule {
  @PrimaryGeneratedColumn("uuid", { name: "rate_rule_id" })
  rateRuleId!: string;

  @Column({ name: "rate_plan_id" })
  ratePlanId!: string;

  @ManyToOne(() => RoomRatePlan, (ratePlan) => ratePlan.rules, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "rate_plan_id" })
  ratePlan!: RoomRatePlan;

  @Column({ name: "room_type_id" })
  roomTypeId!: string;

  @ManyToOne(() => RoomType, (roomType) => roomType.rateRules, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "room_type_id" })
  roomType!: RoomType;

  @Column({ name: "rule_type", type: "enum", enum: RoomRateRuleType })
  ruleType!: RoomRateRuleType;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  price!: string;

  @Column({ name: "unit_minutes", type: "int", nullable: true })
  unitMinutes!: number | null;

  @Column({ name: "min_duration_minutes", type: "int", nullable: true })
  minDurationMinutes!: number | null;

  @Column({ name: "max_duration_minutes", type: "int", nullable: true })
  maxDurationMinutes!: number | null;

  @Column({ name: "start_time", type: "time", nullable: true })
  startTime!: string | null;

  @Column({ name: "end_time", type: "time", nullable: true })
  endTime!: string | null;

  @Column({ default: 0 })
  priority!: number;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;
}
