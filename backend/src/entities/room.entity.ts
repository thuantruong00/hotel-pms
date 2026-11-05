import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { RoomType } from "./room-type.entity";
import { RoomStatus } from "~/utils/enum";

@Entity("rooms")
@Index(["roomNumber"], { unique: true })
export class Room {
  @PrimaryGeneratedColumn("uuid", { name: "room_id" })
  roomId!: string;

  @Column({ name: "room_type_id", type: "uuid" })
  roomTypeId!: string;

  @ManyToOne(() => RoomType, (roomType) => roomType.rooms, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "room_type_id" })
  roomType!: RoomType;

  @Column({ name: "room_number", type: "varchar", length: 20 })
  roomNumber!: string;

  @Column({ type: "int", nullable: true })
  floor!: number | null;

  @Column({ type: "enum", enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status!: RoomStatus;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

}
