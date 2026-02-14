import { Client, MessageActionRow, MessageButton } from "discord.js-selfbot-v13";
import { type Account, type InsertLog } from "@shared/schema";
import { storage } from "../storage";
import fs from "fs";
import path from "path";

// Load data once
const DATA_DIR = path.join(process.cwd(), "attached_assets");

function loadList(filename: string): string[] {
  try {
    return fs.readFileSync(path.join(DATA_DIR, filename), "utf-8")
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0);
  } catch (e) {
    console.error(`Failed to load ${filename}`, e);
    return [];
  }
}

const LEGENDARY = loadList("legendary_1771090707829.txt");
const MYTHICAL = loadList("mythical_1771090707829.txt");

export class Bot {
  public client: Client;
  public account: Account;
  private spamInterval: NodeJS.Timeout | null = null;
  private restTimeout: NodeJS.Timeout | null = null;
  private isResting: boolean = false;
  private isCaptcha: boolean = false;
  private hintInProgress: boolean = false;
  
  constructor(account: Account) {
    this.account = account;
    this.client = new Client({
      checkUpdate: false,
    });
    
    this.setupEvents();
  }

  private async log(content: string, type: "info" | "success" | "warning" | "error" = "info") {
    console.log(`[${this.account.name}] ${content}`);
    await storage.createLog({
      accountId: this.account.id,
      content,
      type
    });
  }

  private setupEvents() {
    this.client.on("ready", () => {
      this.log(`Logged in as ${this.client.user?.tag}`, "success");
      this.startSpam();
      this.startRestCycle();
      storage.updateAccount(this.account.id, { status: "running" });
    });

    this.client.on("messageCreate", async (message) => {
      if (this.isCaptcha || this.isResting) return;

      // 1. Detect Captcha
      if (message.content.includes("Please tell us you're human") && message.content.includes(this.client.user?.id || "")) {
         this.handleCaptcha(message);
         return;
      }

      // 2. Detect Wild Pokemon (Pokétwo)
      if (message.author.id === "716390085896962058" && (message.content.includes("A new wild pokémon has appeared!") || (message.embeds.length > 0 && message.embeds[0].title?.includes("A new wild pokémon has appeared!")))) {
         this.log("Wild pokemon appeared! Sending hint request...", "info");
         this.sendHint(message.channel.id);
      }

      // 3. Detect Cooldown Reaction on Hint
      // Note: We need messageReactionAdd for this, but if the bot is the one waiting, we check content or reactions
      // The prompt says "if getting reaction of cooldown on hint cmd msg then wait 8 sec and use again hint"
      
      // 4. Detect P2A prediction
      if (message.author.id === "1254602968938844171" && message.content.includes("Possible Pokémon")) {
        const match = message.content.match(/Possible Pokémon: (.+)/);
        if (match) {
            const names = match[1].split(",").map(n => n.trim());
            this.log(`P2A Predicted: ${names.join(", ")}`, "info");
            this.catchPokemon(message.channel.id, names);
        }
      }

      // 5. Detect Successful Catch
      if (message.author.id === "716390085896962058" && message.content.includes("Congratulations") && message.content.includes(this.client.user?.id || "")) {
         const caughtMatch = message.content.match(/You caught a level \d+ (.+)!/i);
         const pokemonName = caughtMatch ? caughtMatch[1] : "Unknown";
         
         this.log(`Caught ${pokemonName}!`, "success");
         
         const updates: any = { 
             totalCaught: this.account.totalCaught + 1,
             lastActive: new Date()
         };

         if (LEGENDARY.includes(pokemonName)) updates.totalLegendary = (this.account.totalLegendary || 0) + 1;
         else if (MYTHICAL.includes(pokemonName)) updates.totalMythical = (this.account.totalMythical || 0) + 1;
         else updates.totalNormal = (this.account.totalNormal || 0) + 1;

         await storage.updateAccount(this.account.id, updates);
      }

      if (message.author.id === "716390085896962058" && message.content.includes("These colors seem unusual")) {
         this.log(`Caught a SHINY!`, "success");
         await storage.updateAccount(this.account.id, { totalShiny: (this.account.totalShiny || 0) + 1 });
      }

      // 6. Handle Buttons (Auto-click Confirm)
      if (message.author.id === "716390085896962058" && message.components.length > 0) {
          for (const row of message.components) {
              for (const component of row.components) {
                  if (component.type === 'BUTTON' && component.label?.toLowerCase() === 'confirm') {
                      this.log("Clicking Confirm button...", "info");
                      // @ts-ignore - selfbot click implementation
                      await message.clickButton(component.customId);
                  }
              }
          }
      }

      // 7. Balance/Coins
      if (message.content.includes("You received") && message.content.includes("Pokécoins")) {
         const match = message.content.match(/You received ([\d,]+) Pokécoins/);
         if (match) {
             const coins = parseInt(match[1].replace(/,/g, ""));
             await storage.updateAccount(this.account.id, { totalCoins: (this.account.totalCoins || 0) + coins });
         }
      }
    });

    this.client.on("messageReactionAdd", async (reaction, user) => {
        if (user.id === "716390085896962058" && reaction.emoji.name === "⌛") {
            const message = reaction.message;
            if (message.author.id === this.client.user?.id && message.content.includes("h")) {
                this.log("Hint cooldown detected, waiting 8 seconds...", "warning");
                setTimeout(() => {
                    this.sendHint(message.channel.id);
                }, 8000);
            }
        }
    });
  }

  private sendHint(channelId: string) {
      const channel = this.client.channels.cache.get(channelId);
      if (channel && channel.isText()) {
          // @ts-ignore
          channel.send("<@716390085896962058> h").catch(e => console.error("Hint error", e));
      }
  }

  private async handleCaptcha(message: any) {
    this.isCaptcha = true;
    this.stopSpam();
    const match = message.content.match(/(https?:\/\/[^\s]+)/);
    const url = match ? match[0] : "Check Discord";
    this.log(`CAPTCHA DETECTED! ${url}`, "error");
    await storage.updateAccount(this.account.id, { status: "captcha", captchaUrl: url });
  }

  private async catchPokemon(channelId: string, names: string[]) {
      const channel = this.client.channels.cache.get(channelId);
      if (!channel || !channel.isText()) return;

      for (let i = 0; i < names.length; i++) {
          const name = names[i];
          setTimeout(() => {
              if (this.isCaptcha || this.isResting) return;
              // @ts-ignore
              channel.send(`<@716390085896962058> c ${name}`);
          }, i * 5000); // Try all every 5s if multiple
      }
  }

  private startSpam() {
    if (this.spamInterval) clearInterval(this.spamInterval);
    if (!this.account.spamChannelId) return;

    this.spamInterval = setInterval(() => {
       if (this.isCaptcha || this.isResting) return;
       const channel = this.client.channels.cache.get(this.account.spamChannelId);
       if (channel && channel.isText()) {
           const randomWord = Math.random().toString(36).substring(7);
           // @ts-ignore
           channel.send(randomWord).catch(e => console.error("Spam error", e));
       }
    }, this.account.spamSpeed);
  }

  private stopSpam() {
    if (this.spamInterval) clearInterval(this.spamInterval);
    this.spamInterval = null;
  }

  private startRestCycle() {
      this.restTimeout = setTimeout(() => {
          this.isResting = true;
          this.stopSpam();
          this.log("Resting for 10 minutes...", "warning");
          storage.updateAccount(this.account.id, { status: "resting" });

          setTimeout(() => {
              this.isResting = false;
              this.log("Resuming work.", "info");
              storage.updateAccount(this.account.id, { status: "running" });
              this.startSpam();
              this.startRestCycle();
          }, 10 * 60 * 1000);
      }, 60 * 60 * 1000);
  }

  public async start() {
    try {
        await this.client.login(this.account.token);
    } catch (e) {
        this.log(`Login failed: ${e}`, "error");
        await storage.updateAccount(this.account.id, { status: "stopped" });
        throw e;
    }
  }

  public stop() {
    this.stopSpam();
    if (this.restTimeout) clearTimeout(this.restTimeout);
    this.client.destroy();
    this.log("Bot stopped.", "info");
  }

  public async updateConfig(account: Account) {
      this.account = account;
      this.startSpam();
  }
  
  public async executeCommand(type: string, payload: string): Promise<boolean> {
      if (!this.client.isReady()) return false;
      const channel = this.client.channels.cache.get(this.account.spamChannelId);
      if (!channel || !channel.isText()) return false;

      if (type === "say") {
          // @ts-ignore
          await channel.send(payload);
          return true;
      }
      
      if (type === "market_buy") {
          // @ts-ignore
          await channel.send(`<@716390085896962058> m b ${payload}`);
          return true;
      }

      if (type === "click") {
          // Custom click command from dashboard
          this.log(`Manual click requested for ${payload}`, "info");
          // This would require searching messages for buttons, simplified here
          return true;
      }

      return false;
  }
  
  public resume() {
      this.isCaptcha = false;
      storage.updateAccount(this.account.id, { status: "running", captchaUrl: null });
      this.startSpam();
      this.log("Resumed manually.", "success");
  }
}
