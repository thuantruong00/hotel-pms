import { Customer } from "~/entities/customer.entity";
import { CustomerIdentity } from "~/entities/customer-identity.entity";
import { AppError } from "~/errors";
import { customerRepository, CustomerListFilter } from "~/repositories/customer.repository";
import { Db, runInTransaction } from "~/repositories/db";
import { IdentityStatus } from "~/utils/enum";
import { paged } from "~/utils/pagination";

export type IdentityInput = {
  identityType: string;
  identityNumber: string;
  nameOnDocument?: string | null;
  nationality?: string | null;
  dateOfBirth?: string | null;
  issuedDate?: string | null;
  expiryDate?: string | null;
};

export type CreateCustomerInput = {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  identity?: IdentityInput;
};

export type UpdateCustomerInput = {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

export type AddIdentityInput = IdentityInput & {
  /** Previous identity replaced by this document; it is kept, not overwritten. */
  replacesIdentityId?: string;
};

/** Masks all but the last 4 characters of an identity number. */
export const maskIdentityNumber = (value: string) =>
  value.length <= 4 ? "*".repeat(value.length) : `${"*".repeat(value.length - 4)}${value.slice(-4)}`;

const maskIdentity = (identity: CustomerIdentity) => ({
  ...identity,
  identityNumber: maskIdentityNumber(identity.identityNumber),
});

const toListItem = (customer: Customer) => ({
  ...customer,
  identities: (customer.identities ?? []).map(maskIdentity),
});

async function assertIdentityUnique(input: IdentityInput, db: Db) {
  const existing = await customerRepository.findIdentityByTypeAndNumber(
    input.identityType,
    input.identityNumber,
    db,
  );
  if (existing) {
    throw AppError.conflict(
      "IDENTITY_ALREADY_EXISTS",
      "An identity with the same type and number already exists",
      { customerId: existing.customerId },
    );
  }
}

const identityEntity = (customerId: string, input: IdentityInput): Partial<CustomerIdentity> => ({
  customerId,
  identityType: input.identityType,
  identityNumber: input.identityNumber,
  nameOnDocument: input.nameOnDocument ?? null,
  nationality: input.nationality ?? null,
  dateOfBirth: input.dateOfBirth ?? null,
  issuedDate: input.issuedDate ?? null,
  expiryDate: input.expiryDate ?? null,
  status: IdentityStatus.ACTIVE,
});

async function getOrThrow(customerId: string) {
  const customer = await customerRepository.findByIdWithIdentities(customerId);
  if (!customer) throw AppError.notFound("CUSTOMER_NOT_FOUND", "The customer does not exist");
  return customer;
}

export const customerService = {
  async create(input: CreateCustomerInput) {
    const customerId = await runInTransaction(async (db) => {
      if (input.identity) await assertIdentityUnique(input.identity, db);

      const customer = await customerRepository.save(
        {
          fullName: input.fullName ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          notes: input.notes ?? null,
        },
        db,
      );
      if (input.identity) {
        await customerRepository.saveIdentity(identityEntity(customer.customerId, input.identity), db);
      }
      return customer.customerId;
    });
    return getOrThrow(customerId);
  },

  async list(filter: CustomerListFilter) {
    const [customers, total] = await customerRepository.list(filter);
    return paged(customers.map(toListItem), total, filter);
  },

  getById: getOrThrow,

  async update(customerId: string, input: UpdateCustomerInput) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw AppError.notFound("CUSTOMER_NOT_FOUND", "The customer does not exist");

    // customerId is immutable; only whitelisted fields are copied.
    const changes: Partial<Customer> = { customerId };
    for (const key of ["fullName", "phone", "email", "notes", "isActive"] as const) {
      if (input[key] !== undefined) (changes as any)[key] = input[key];
    }
    await customerRepository.save(changes);
    return getOrThrow(customerId);
  },

  async addIdentity(customerId: string, input: AddIdentityInput) {
    const identityId = await runInTransaction(async (db) => {
      const customer = await customerRepository.findById(customerId, db);
      if (!customer) throw AppError.notFound("CUSTOMER_NOT_FOUND", "The customer does not exist");

      await assertIdentityUnique(input, db);

      let replaced: CustomerIdentity | null = null;
      if (input.replacesIdentityId) {
        replaced = await customerRepository.findIdentityById(input.replacesIdentityId, db);
        if (!replaced || replaced.customerId !== customerId) {
          throw AppError.notFound("IDENTITY_NOT_FOUND", "The identity to replace does not exist");
        }
        if (replaced.status !== IdentityStatus.ACTIVE) {
          throw AppError.conflict("IDENTITY_ALREADY_REPLACED", "The identity has already been replaced");
        }
      }

      const created = await customerRepository.saveIdentity(identityEntity(customerId, input), db);

      if (replaced) {
        // Keep the old record for history; only mark it as replaced.
        await customerRepository.saveIdentity(
          {
            identityId: replaced.identityId,
            status: IdentityStatus.REPLACED,
            replacedByIdentityId: created.identityId,
          },
          db,
        );
      }
      return created.identityId!;
    });

    const identity = await customerRepository.findIdentityById(identityId);
    return identity;
  },
};
