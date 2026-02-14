import { sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  token: text("token").notNull(),
  catchChannelId: text("catch_channel_id").notNull(),
  spamChannelId: text("spam_channel_id").notNull(),
  spamSpeed: integer("spam_speed").default(3000).notNull(), // ms
  catchSpeed: integer("catch_speed").default(2000).notNull(), // ms
  status: text("status").default("stopped").notNull(), // stopped, running, captcha, resting
  ownerIds: text("owner_ids").array().default([]), // For "Say" command
  marketId: text("market_id"), // For market buying
  
  // Stats
  totalCaught: integer("total_caught").default(0).notNull(),
  totalCoins: integer("total_coins").default(0).notNull(),
  totalShiny: integer("total_shiny").default(0).notNull(),
  totalLegendary: integer("total_legendary").default(0).notNull(),
  totalMythical: integer("total_mythical").default(0).notNull(),
  totalNormal: integer("total_normal").default(0).notNull(),
  balance: integer("balance").default(0).notNull(),
  
  // Internal state
  captchaUrl: text("captcha_url"),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id),
  type: text("type").notNull(), // info, success, warning, error
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Schemas
export const insertAccountSchema = createInsertSchema(accounts).omit({ 
  id: true, 
  status: true, 
  totalCaught: true, 
  totalCoins: true, 
  totalShiny: true, 
  totalLegendary: true, 
  totalMythical: true, 
  totalNormal: true,
  balance: true,
  captchaUrl: true, 
  lastActive: true, 
  createdAt: true 
});

export const insertLogSchema = createInsertSchema(logs).omit({ id: true, timestamp: true });

// Types
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

// API Types
export type UpdateAccountRequest = Partial<InsertAccount>;
export type CommandRequest = { command: string; args?: string[] };
export type CaptchaSolveRequest = { solution: string }; // Assuming manual solve or external service
