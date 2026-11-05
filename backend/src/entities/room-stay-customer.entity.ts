import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "./customer.entity";
import { RoomStay } from "./room-stay.entity";

@Entity("room_stay_customers")
@Index(["stayId", "customerId"], { unique: true })
export class RoomStayCustomer {
  @PrimaryGeneratedColumn("uuid", { name: "room_stay_customer_id" })
  roomStayCustomerId!: string;

  @Column({ name: "stay_id", type: "uuid" })
  stayId!: string;

  @ManyToOne(() => RoomStay, (stay) => stay.guests, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "stay_id" })
  stay!: RoomStay;

  @Column({ name: "customer_id", type: "uuid" })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.roomStayLinks, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "customer_id" })
  customer!: Customer;

  @Column({ name: "is_primary", type: "boolean", default: false })
  isPrimary!: boolean;

}
