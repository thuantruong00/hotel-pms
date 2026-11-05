import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { IsInt, IsOptional, IsString, Length, Min } from "class-validator";
import { User } from "./user.entity";

@Entity("user_credentials")
@Index(["userId"], { unique: true })
export class UserCredential {
  @PrimaryGeneratedColumn("uuid", { name: "credential_id" })
  credentialId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @OneToOne(() => User, (user) => user.credentials, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  @IsString()
  @Length(60, 255)
  passwordHash!: string;

  @Column({ name: "password_changed_at", type: "timestamptz", nullable: true })
  passwordChangedAt!: Date | null;

  @Column({ name: "failed_attempts", type: "int", default: 0 })
  @IsInt()
  @Min(0)
  failedAttempts!: number;

  @Column({ name: "locked_until", type: "timestamptz", nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
