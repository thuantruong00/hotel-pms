import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { IsIn, IsOptional, IsString, Length, Matches } from "class-validator";
import { UserCredential } from "./user-credential.entity";

@Entity("users")
@Index(["username"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid", { name: "user_id" })
  userId!: string;

  @Column({ length: 80 })
  @IsString()
  @Length(3, 80)
  @Matches(/^[a-zA-Z0-9._-]+$/)
  username!: string;

  @Column({ name: "display_name", length: 150, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 150)
  displayName!: string | null;

  @Column({ length: 30, default: "staff" })
  @IsIn(["admin", "manager", "staff"])
  role!: string;

  @Column({ length: 20, default: "active" })
  @IsIn(["active", "inactive", "locked"])
  status!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToOne(() => UserCredential, (credential) => credential.user)
  credentials!: UserCredential;
}
