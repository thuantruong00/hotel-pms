import { EntityManager } from "typeorm";
import { AppDataSource } from "~/config/dataSource";

/** Entity manager to use; pass the transaction manager inside transactions. */
export type Db = EntityManager;

export const defaultDb = (): Db => AppDataSource.manager;

export const runInTransaction = <T>(work: (db: Db) => Promise<T>): Promise<T> =>
  AppDataSource.transaction(work);
