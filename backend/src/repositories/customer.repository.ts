import { In } from "typeorm";
import { Customer } from "~/entities/customer.entity";
import { CustomerIdentity } from "~/entities/customer-identity.entity";
import { PageQuery, toSkip } from "~/utils/pagination";
import { Db, defaultDb } from "./db";

export type CustomerListFilter = PageQuery & {
  search?: string;
  isActive?: boolean;
};

export const customerRepository = {
  findById: (id: string, db: Db = defaultDb()) =>
    db.getRepository(Customer).findOne({ where: { customerId: id } }),

  findByIdWithIdentities: (id: string, db: Db = defaultDb()) =>
    db.getRepository(Customer).findOne({
      where: { customerId: id },
      relations: { identities: true },
      order: { identities: { createdAt: "DESC" } },
    }),

  findActiveByIds: (ids: string[], db: Db = defaultDb()) =>
    ids.length === 0
      ? Promise.resolve([] as Customer[])
      : db.getRepository(Customer).find({ where: { customerId: In(ids), isActive: true } }),

  /** Searches by name, phone, email, or identity number. */
  list: (f: CustomerListFilter, db: Db = defaultDb()) => {
    const qb = db
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .leftJoinAndSelect(
        "customer.identities",
        "identity",
        "identity.status = :activeIdentity",
        { activeIdentity: "active" },
      )
      .orderBy("customer.createdAt", "DESC")
      .skip(toSkip(f))
      .take(f.limit);

    if (f.isActive !== undefined) {
      qb.andWhere("customer.isActive = :isActive", { isActive: f.isActive });
    }
    if (f.search) {
      qb.andWhere(
        `(customer.fullName ILIKE :s OR customer.phone ILIKE :s OR customer.email ILIKE :s
          OR EXISTS (SELECT 1 FROM customer_identities ci
                     WHERE ci.customer_id = customer.customer_id AND ci.identity_number ILIKE :s))`,
        { s: `%${escapeLike(f.search)}%` },
      );
    }
    return qb.getManyAndCount();
  },

  save: (customer: Partial<Customer>, db: Db = defaultDb()) =>
    db.getRepository(Customer).save(customer),

  findIdentityById: (identityId: string, db: Db = defaultDb()) =>
    db.getRepository(CustomerIdentity).findOne({ where: { identityId } }),

  findIdentityByTypeAndNumber: (
    identityType: string,
    identityNumber: string,
    db: Db = defaultDb(),
  ) =>
    db.getRepository(CustomerIdentity).findOne({ where: { identityType, identityNumber } }),

  saveIdentity: (identity: Partial<CustomerIdentity>, db: Db = defaultDb()) =>
    db.getRepository(CustomerIdentity).save(identity),
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}
