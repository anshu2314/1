
import { db } from "./db";
import {
  accounts,
  logs,
  type Account,
  type InsertAccount,
  type Log,
  type InsertLog,
  type UpdateAccountRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: UpdateAccountRequest): Promise<Account>;
  deleteAccount(id: number): Promise<void>;
  
  // Logs
  createLog(log: InsertLog): Promise<Log>;
  getLogs(accountId?: number, limit?: number): Promise<Log[]>;
}

export class DatabaseStorage implements IStorage {
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).orderBy(accounts.id);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async updateAccount(id: number, updates: UpdateAccountRequest): Promise<Account> {
    const [updated] = await db.update(accounts)
      .set(updates)
      .where(eq(accounts.id, id))
      .returning();
    return updated;
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(log).returning();
    return newLog;
  }

  async getLogs(accountId?: number, limit: number = 50): Promise<Log[]> {
    let query = db.select().from(logs).orderBy(desc(logs.timestamp)).limit(limit);
    
    if (accountId) {
      // @ts-ignore - dynamic query construction
      query.where(eq(logs.accountId, accountId));
    }
    
    return await query;
  }
}

export const storage = new DatabaseStorage();
