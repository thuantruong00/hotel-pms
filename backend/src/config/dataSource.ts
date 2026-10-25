import { DataSource } from "typeorm";
import { env } from "~/utils/env";
import { Customer } from "~/entities/customer.entity";
import { CustomerIdentity } from "~/entities/customer-identity.entity";
import { User } from "~/entities/user.entity";
import { UserCredential } from "~/entities/user-credential.entity";
import { RoomType } from "~/entities/room-type.entity";
import { Room } from "~/entities/room.entity";
import { RoomRatePlan } from "~/entities/room-rate-plan.entity";
import { RoomRateRule } from "~/entities/room-rate-rule.entity";
import { RoomStay } from "~/entities/room-stay.entity";
import { RoomStayCharge } from "~/entities/room-stay-charge.entity";
import { WorkSession } from "~/entities/work-session.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: env.DB_CONNECT_STRING,
  synchronize: false,
  logging: false,
  entities: [
    Customer,
    CustomerIdentity,
    User,
    UserCredential,
    RoomType,
    Room,
    RoomRatePlan,
    RoomRateRule,
    RoomStay,
    RoomStayCharge,
    WorkSession,
  ],
  migrations: [],
  subscribers: [],
});

export const connectPostgres = async () => {
  if (!env.DB_CONNECT_STRING) {
    console.error("DB_CONNECT_STRING is empty");
    return null;
  }

  if (AppDataSource.isInitialized) return AppDataSource;

  try {
    await AppDataSource.initialize();
    console.log("PostgreSQL connected");
    return AppDataSource;
  } catch (err) {
    console.error("PostgreSQL connection error:", err);
    return null;
  }
};
