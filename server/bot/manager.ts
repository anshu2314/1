
import { Bot } from "./bot";
import { type Account } from "@shared/schema";
import { storage } from "../storage";

class BotManager {
  private bots: Map<number, Bot> = new Map();

  async startBot(account: Account) {
    if (this.bots.has(account.id)) {
      await this.stopBot(account.id);
    }

    const bot = new Bot(account);
    await bot.start();
    this.bots.set(account.id, bot);
  }

  async stopBot(accountId: number) {
    const bot = this.bots.get(accountId);
    if (bot) {
      await bot.stop();
      this.bots.delete(accountId);
    }
  }

  async updateConfig(accountId: number, account: Account) {
    const bot = this.bots.get(accountId);
    if (bot) {
      bot.updateConfig(account);
    }
  }
  
  async executeCommand(accountId: number, type: string, payload: string) {
      const bot = this.bots.get(accountId);
      if (bot) {
          return await bot.executeCommand(type, payload);
      }
      return false;
  }
  
  async resumeAfterCaptcha(accountId: number) {
      const bot = this.bots.get(accountId);
      if (bot) {
          await bot.resume();
      }
  }

  // Restore bots on server start
  async restoreBots() {
      const accounts = await storage.getAccounts();
      for (const account of accounts) {
          if (account.status === "running" || account.status === "captcha") {
              // Should we auto-restart? 
              // Maybe set them to stopped first to be safe, or try to restart.
              // Let's try to restart but log it.
              console.log(`Restoring bot ${account.name}...`);
              try {
                  await this.startBot(account);
              } catch (e) {
                  console.error(`Failed to restore ${account.name}`, e);
                  await storage.updateAccount(account.id, { status: "stopped" });
              }
          }
      }
  }
}

export const botManager = new BotManager();
