
import { Client } from "discord.js-selfbot-v13";
import { type Account, type InsertLog } from "@shared/schema";
import { storage } from "../storage";
import { log } from "../vite"; // Or a custom logger
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
// We might need a full pokemon list for fuzzy matching if "Possible Pokemon" gives partials, 
// but usually P2A (PokeTwo Assistant?) gives full names. 
// The prompt says "detect P2A 'Possible Pokémon: {name}'".
// If P2A gives the name, we just use it.

export class Bot {
  public client: Client;
  public account: Account;
  private spamInterval: NodeJS.Timeout | null = null;
  private restTimeout: NodeJS.Timeout | null = null;
  private isResting: boolean = false;
  private isCaptcha: boolean = false;
  
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
      if (message.author.id === "716390085896962058" && message.content.includes("Wild pokémon has appeared")) {
         // Send hint request
         setTimeout(() => {
             message.channel.send("<@716390085896962058> h"); 
         }, 1000); // Slight delay
      }

      // 3. Detect Hint / P2A prediction
      // P2A ID: 1254602968938844171
      if (message.author.id === "1254602968938844171" && message.content.includes("Possible Pokémon")) {
        // Content: "Possible Pokémon: Name1, Name2"
        const match = message.content.match(/Possible Pokémon: (.+)/);
        if (match) {
            const names = match[1].split(",").map(n => n.trim());
            this.catchPokemon(message.channel.id, names);
        }
      }

      // 4. Detect Successful Catch
      if (message.author.id === "716390085896962058" && message.content.includes("Congratulations") && message.content.includes(this.client.user?.id || "")) {
         this.log(`Caught a pokemon!`, "success");
         await storage.updateAccount(this.account.id, { 
             totalCaught: this.account.totalCaught + 1,
             lastActive: new Date()
         });
         
         // Check for shiny/legendary/mythical in the message?
         // Usually separate message or embed details. 
         // "These colors seem unusual..." -> Shiny
      }

      if (message.author.id === "716390085896962058" && message.content.includes("These colors seem unusual")) {
         this.log(`Caught a SHINY!`, "success");
         await storage.updateAccount(this.account.id, { totalShiny: this.account.totalShiny + 1 });
      }

      // 5. Balance/Coins
      if (message.content.includes("You received") && message.content.includes("Pokécoins")) {
         const match = message.content.match(/You received ([\d,]+) Pokécoins/);
         if (match) {
             const coins = parseInt(match[1].replace(/,/g, ""));
             await storage.updateAccount(this.account.id, { totalCoins: this.account.totalCoins + coins });
         }
      }
    });
  }

  private async handleCaptcha(message: any) {
    this.isCaptcha = true;
    this.stopSpam();
    
    // Extract link if present? Usually it's an image or link.
    // "Whoa there. Please tell us you're human! https://verify.poketwo.net/..."
    const match = message.content.match(/(https?:\/\/[^\s]+)/);
    const url = match ? match[0] : "Check Discord";
    
    this.log(`CAPTCHA DETECTED! ${url}`, "error");
    
    await storage.updateAccount(this.account.id, { 
        status: "captcha", 
        captchaUrl: url 
    });
  }

  private async catchPokemon(channelId: string, names: string[]) {
      const channel = this.client.channels.cache.get(channelId);
      if (!channel || !channel.isText()) return;

      for (const name of names) {
          // Check rarity
          if (LEGENDARY.includes(name)) await storage.updateAccount(this.account.id, { totalLegendary: this.account.totalLegendary + 1 });
          if (MYTHICAL.includes(name)) await storage.updateAccount(this.account.id, { totalMythical: this.account.totalMythical + 1 });

          // Catch
          // @Pokétwo c Name
          // Use <@716390085896962058>
          setTimeout(() => {
              // @ts-ignore
              channel.send(`<@716390085896962058> c ${name}`);
          }, this.account.catchSpeed); // Use catch speed delay
      }
  }

  private startSpam() {
    if (this.spamInterval) clearInterval(this.spamInterval);
    if (!this.account.spamChannelId) return;

    this.spamInterval = setInterval(() => {
       if (this.isCaptcha || this.isResting) return;
       
       const channel = this.client.channels.cache.get(this.account.spamChannelId);
       if (channel && channel.isText()) {
           // Random string
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
      // 1h work, 10m rest
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
              this.startRestCycle(); // Restart cycle
          }, 10 * 60 * 1000); // 10m

      }, 60 * 60 * 1000); // 1h
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
      // Restart spam with new speed
      this.startSpam();
  }
  
  public async executeCommand(type: string, payload: string): Promise<boolean> {
      if (!this.client.isReady()) return false;
      
      const channel = this.client.channels.cache.get(this.account.spamChannelId); // Default to spam channel for commands
      if (!channel || !channel.isText()) return false;

      if (type === "say") {
          // @ts-ignore
          await channel.send(payload);
          return true;
      }
      
      if (type === "market_buy") {
          // @Pokétwo m b {id}
          // @ts-ignore
          await channel.send(`<@716390085896962058> m b ${payload}`);
          // Auto confirm? 
          setTimeout(() => {
              // @ts-ignore
              channel.send(`<@716390085896962058> confirm`);
          }, 2000);
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
