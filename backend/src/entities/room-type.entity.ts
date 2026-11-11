import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Room } from "./room.entity";
import { RoomRatePlan } from "./room-rate-plan.entity";

@Entity("room_types")
export class RoomType {
  @PrimaryGeneratedColumn("uuid", { name: "room_type_id" })
  roomTypeId!: string;

  @Column({ type: "varchar", length: 30, unique: true })
  code!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "int", default: 2 })
  capacity!: number;

  @Column({ name: "bed_count", type: "int", default: 1 })
  bedCount!: number;

  @Column({ name: "bed_type", type: "varchar", length: 50, nullable: true })
  bedType!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => Room, (room) => room.roomType)
  rooms!: Room[];

  @OneToMany(() => RoomRatePlan, (ratePlan) => ratePlan.roomType)
  ratePlans!: RoomRatePlan[];

}
