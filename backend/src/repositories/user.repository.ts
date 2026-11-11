import { User } from "~/entities/user.entity";
import { UserCredential } from "~/entities/user-credential.entity";
import { PageQuery, toSkip } from "~/utils/pagination";
import { Db, defaultDb } from "./db";

export const userRepository = {
  findById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(User).findOne({ where: { userId: id } }),

  findByIdWithCredential: (id: string, db: Db = defaultDb()) =>
    db.getRepository(User).findOne({ where: { userId: id }, relations: { credentials: true } }),

  findByUsernameWithCredential: (username: string, db: Db = defaultDb()) =>
    db
      .getRepository(User)
      .findOne({ where: { username }, relations: { credentials: true } }),

  existsByUsername: (username: string, db: Db = defaultDb()) =>
    db.getRepository(User).exists({ where: { username } }),

  countByRole: (role: string, db: Db = defaultDb()) =>
    db.getRepository(User).count({ where: { role } }),

  list: (q: PageQuery, db: Db = defaultDb()) =>
    db.getRepository(User).findAndCount({
      order: { createdAt: "DESC" },
      skip: toSkip(q),
      take: q.limit,
    }),

  saveUser: (user: Partial<User>, db: Db = defaultDb()) => db.getRepository(User).save(user),

  saveCredential: (credential: Partial<UserCredential>, db: Db = defaultDb()) =>
    db.getRepository(UserCredential).save(credential),
};
