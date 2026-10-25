import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomStay } from "./room-stay.entity";

@Entity("room_stay_charges")
@Index(["stayId", "createdAt"])
export class RoomStayCharge {
  @PrimaryGeneratedColumn("uuid", { name: "charge_id" })
  chargeId!: string;

  @Column({ name: "stay_id" })
  stayId!: string;

  @ManyToOne(() => RoomStay, (roomStay) => roomStay.charges, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "stay_id" })
  roomStay!: RoomStay;

  @Column({ name: "charge_type", length: 40 })
  chargeType!: string;

  @Column({ length: 255 })
  description!: string;

  @Column({ type: "numeric", precision: 12, scale: 3, default: 1 })
  quantity!: string;

  @Column({ name: "unit_minutes", type: "int", nullable: true })
  unitMinutes!: number | null;

  @Column({ name: "unit_price", type: "numeric", precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  amount!: string;

  @Column({ name: "calculated_from", type: "timestamptz", nullable: true })
  calculatedFrom!: Date | null;

  @Column({ name: "calculated_to", type: "timestamptz", nullable: true })
  calculatedTo!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
