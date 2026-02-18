import { Client } from "discord.js-selfbot-v13";
import { type Account, type InsertLog } from "@shared/schema";
import { storage } from "../storage";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "attached_assets");

function loadList(filename: string): string[] {
    try {
        return fs
            .readFileSync(path.join(DATA_DIR, filename), "utf-8")
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
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
    private balanceInterval: NodeJS.Timeout | null = null;
    private pendingHintChannelId: string | null = null;

    constructor(account: Account) {
        this.account = account;
        this.client = new Client({
            checkUpdate: false,
        } as any);

        this.setupEvents();
    }

    private async log(
        content: string,
        type: "info" | "success" | "warning" | "error" = "info",
    ) {
        console.log(`[${this.account.name}] ${content}`);
        await storage.createLog({
            accountId: this.account.id,
            content,
            type,
        });
    }

    private setupEvents() {
        this.client.on("ready", () => {
            this.log(`Logged in as ${this.client.user?.tag}`, "success");
            this.startSpam();
            this.startRestCycle();
            this.startBalanceCycle();
            storage.updateAccount(this.account.id, { status: "running" });
        });

        this.client.on("messageCreate", async (message) => {
            if (!message || !message.author) return;
            if (this.isCaptcha || this.isResting) return;

            // CRITICAL: Only process messages in the configured catch channel or spam channel
            const allowedChannels = [this.account.catchChannelId, this.account.spamChannelId].filter(Boolean);
            if (!allowedChannels.includes(message.channel.id)) return;

            const content = message.content || "";
            const embed = message.embeds?.[0];
            const embedTitle = embed?.title || "";
            const embedDescription = embed?.description || "";

            // 1. Detect Captcha
            if (
                content.includes("Please tell us you're human") &&
                content.includes(this.client.user?.id || "")
            ) {
                this.handleCaptcha(message);
                return;
            }

            // 2. Detect Wild Pokemon Spawn (Pokétwo)
            const isPoketwo = message.author.id === "716390085896962058";

            // Check for spawn text in content or any part of the embed
            let hasSpawnText = content.includes(
                "A new wild pokémon has appeared!",
            );

            if (!hasSpawnText && message.embeds && message.embeds.length > 0) {
                for (const embed of message.embeds) {
                    const embedString = JSON.stringify(embed);
                    if (
                        (embed.title &&
                            embed.title.includes(
                                "A new wild pokémon has appeared!",
                            )) ||
                        (embed.description &&
                            embed.description.includes(
                                "A new wild pokémon has appeared!",
                            )) ||
                        (embed.footer &&
                            embed.footer.text &&
                            embed.footer.text.includes(
                                "A new wild pokémon has appeared!",
                            )) ||
                        embedString.includes(
                            "A new wild pokémon has appeared!",
                        ) ||
                        embedString.includes("appeared!") ||
                        embedString.includes("wild pokémon")
                    ) {
                        hasSpawnText = true;
                        break;
                    }
                }
            }

            if (isPoketwo && hasSpawnText) {
                this.log(
                    "Wild pokemon appeared! Sending hint request...",
                    "info",
                );
                this.sendHint(message.channel.id);
            }

            // Detect "That is the wrong pokémon!"
            if (isPoketwo && content.includes("That is the wrong pokémon!")) {
                this.log("Wrong pokemon guessed, retrying hint...", "warning");
                this.sendHint(message.channel.id);
            }

            // 3. Detect P2A Prediction (854233015475109888)
            const isP2A = message.author.id === "854233015475109888";
            if (isP2A && content.includes("Possible Pokémon")) {
                const match = content.match(/Possible Pokémon: (.+)/);
                if (match) {
                    const names = match[1].split(",").map((n) => n.trim());
                    this.log(`P2A Predicted: ${names.join(", ")}`, "info");
                    // Delay each catch by 6 seconds for multiple names
                    names.forEach((name, index) => {
                        setTimeout(() => {
                            if (this.isCaptcha || this.isResting || !this.client.isReady()) return;
                            const channel = this.client.channels.cache.get(message.channel.id);
                            if (channel && channel.isText()) {
                                (channel as any).send(`<@716390085896962058> c ${name}`)
                                    .catch((e: any) => console.error("Catch error", e));
                            }
                        }, index * 6000); // 6s delay as requested
                    });
                }
            }

            // 4. Detect Sierra Prediction (696161886734909481)
            const isSierra = message.author.id === "696161886734909481";
            if (isSierra && message.embeds && message.embeds.length > 0) {
                const sierraEmbed = message.embeds[0];
                const pokemonName = sierraEmbed.title || (sierraEmbed.description ? sierraEmbed.description.split("\n")[0] : "");
                if (pokemonName && !pokemonName.includes(" ")) {
                    this.log(`Sierra Predicted: ${pokemonName}`, "info");
                    const channel = this.client.channels.cache.get(message.channel.id);
                    if (channel && channel.isText()) {
                        (channel as any).send(`<@716390085896962058> c ${pokemonName}`)
                            .catch((e: any) => console.error("Sierra catch error", e));
                    }
                }
            }

            // 5. Detect Successful Catch
            if (
                isPoketwo &&
                content.includes("Congratulations") &&
                content.includes(this.client.user?.id || "")
            ) {
                const caughtMatch = content.match(
                    /You caught a level \d+ (.+)!/i,
                );
                const pokemonName = caughtMatch ? caughtMatch[1] : "Unknown";

                this.log(`Caught ${pokemonName}!`, "success");

                // Re-fetch account to get latest stats before updating
                const currentAccount = await storage.getAccount(
                    this.account.id,
                );
                if (currentAccount) {
                    this.account = currentAccount;
                }

                const updates: any = {
                    totalCaught: (this.account.totalCaught || 0) + 1,
                    lastActive: new Date(),
                };

                if (LEGENDARY.includes(pokemonName))
                    updates.totalLegendary =
                        (this.account.totalLegendary || 0) + 1;
                else if (MYTHICAL.includes(pokemonName))
                    updates.totalMythical =
                        (this.account.totalMythical || 0) + 1;
                else updates.totalNormal = (this.account.totalNormal || 0) + 1;

                await storage.updateAccount(this.account.id, updates);
                // Update local account state
                Object.assign(this.account, updates);
            }

            if (isPoketwo && content.includes("These colors seem unusual")) {
                this.log(`Caught a SHINY!`, "success");
                await storage.updateAccount(this.account.id, {
                    totalShiny: (this.account.totalShiny || 0) + 1,
                });
            }

            // 5. Handle Buttons (Auto-click Confirm)
            if (
                isPoketwo &&
                (message as any).components &&
                (message as any).components.length > 0
            ) {
                for (const row of (message as any).components) {
                    for (const component of row.components) {
                        if (
                            component.type === "BUTTON" &&
                            component.label?.toLowerCase() === "confirm"
                        ) {
                            this.log("Clicking Confirm button...", "info");
                            await (message as any).clickButton(
                                component.customId,
                            );
                        }
                    }
                }
            }

            // 6. Balance/Coins Update from Bal command
            if (isPoketwo && embedTitle.includes("Balance")) {
                const coinsMatch =
                    embedDescription.match(/Pokécoins: ([\d,]+)/);
                if (coinsMatch) {
                    const coins = parseInt(coinsMatch[1].replace(/,/g, ""));
                    this.log(`Updated balance: ${coins} coins`, "info");
                    await storage.updateAccount(this.account.id, {
                        totalCoins: coins,
                    });
                }
            }

            if (
                content.includes("You received") &&
                content.includes("Pokécoins")
            ) {
                const match = content.match(/You received ([\d,]+) Pokécoins/);
                if (match) {
                    const coins = parseInt(match[1].replace(/,/g, ""));
                    const currentAccount = await storage.getAccount(
                        this.account.id,
                    );
                    const newTotal = (currentAccount?.totalCoins || 0) + coins;
                    await storage.updateAccount(this.account.id, {
                        totalCoins: newTotal,
                    });
                }
            }
        });

        this.client.on("messageReactionAdd", async (reaction, user) => {
            if (
                user.id === "716390085896962058" &&
                (reaction.emoji.name === "⌛" || reaction.emoji.name === "⏳")
            ) {
                const message = reaction.message;
                const authorId = message.author?.id;
                const content = message.content || "";

                if (
                    authorId === this.client.user?.id &&
                    content.includes("h")
                ) {
                    this.log(
                        "Hint cooldown detected, retrying in 5 seconds...",
                        "warning",
                    );
                    setTimeout(() => {
                        if (this.pendingHintChannelId) {
                            this.sendHint(this.pendingHintChannelId);
                        }
                    }, 5000);
                }
            }
        });
    }

    private sendHint(channelId: string) {
        const channel = this.client.channels.cache.get(channelId);
        if (channel && channel.isText()) {
            this.pendingHintChannelId = channelId;
            (channel as any)
                .send("<@716390085896962058> h")
                .catch((e: any) => console.error("Hint error", e));
        }
    }

    private async handleCaptcha(message: any) {
        this.isCaptcha = true;
        this.stopSpam();
        this.stopBalanceCycle();
        const content = message.content || "";
        const match = content.match(/(https?:\/\/[^\s]+)/);
        const url = match ? match[0] : "Check Discord";
        this.log(`CAPTCHA DETECTED! ${url}`, "error");
        await storage.updateAccount(this.account.id, {
            status: "captcha",
            captchaUrl: url,
        });
    }

    private async catchPokemon(channelId: string, names: string[]) {
        const channel = this.client.channels.cache.get(channelId);
        if (!channel || !channel.isText()) return;

        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            setTimeout(() => {
                if (this.isCaptcha || this.isResting || !this.client.isReady())
                    return;
                (channel as any)
                    .send(`<@716390085896962058> c ${name}`)
                    .catch((e: any) => console.error("Catch error", e));
            }, i * 5000);
        }
    }

    private startSpam() {
        if (this.spamInterval) clearInterval(this.spamInterval);
        if (!this.account.spamChannelId) return;

        this.spamInterval = setInterval(() => {
            if (this.isCaptcha || this.isResting || !this.client.isReady())
                return;
            const channel = this.client.channels.cache.get(
                this.account.spamChannelId,
            );
            if (channel && channel.isText()) {
                const randomWord = Math.random().toString(36).substring(7);
                (channel as any)
                    .send(randomWord)
                    .catch((e: any) => console.error("Spam error", e));
            }
        }, this.account.spamSpeed);
    }

    private stopSpam() {
        if (this.spamInterval) clearInterval(this.spamInterval);
        this.spamInterval = null;
    }

    private startBalanceCycle() {
        if (this.balanceInterval) clearInterval(this.balanceInterval);

        // Initial balance check
        setTimeout(() => this.checkBalance(), 5000);

        this.balanceInterval = setInterval(
            () => {
                this.checkBalance();
            },
            10 * 60 * 1000,
        ); // 10 minutes
    }

    private stopBalanceCycle() {
        if (this.balanceInterval) clearInterval(this.balanceInterval);
        this.balanceInterval = null;
    }

    private checkBalance() {
        if (this.isCaptcha || this.isResting || !this.client.isReady()) return;

        const channelId =
            this.account.spamChannelId || this.account.catchChannelId;
        const channel = this.client.channels.cache.get(channelId);

        if (channel && channel.isText()) {
            this.log("Checking balance...", "info");
            (channel as any)
                .send("<@716390085896962058> bal")
                .catch((e: any) => console.error("Balance check error", e));
        }
    }

    private startRestCycle() {
        this.restTimeout = setTimeout(
            () => {
                this.isResting = true;
                this.stopSpam();
                this.log("Resting for 10 minutes...", "warning");
                storage.updateAccount(this.account.id, { status: "resting" });

                setTimeout(
                    () => {
                        this.isResting = false;
                        this.log("Resuming work.", "info");
                        storage.updateAccount(this.account.id, {
                            status: "running",
                        });
                        this.startSpam();
                        this.startRestCycle();
                    },
                    10 * 60 * 1000,
                );
            },
            60 * 60 * 1000,
        );
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

    public async executeCommand(
        type: string,
        payload: string,
    ): Promise<boolean> {
        if (!this.client.isReady()) return false;
        const channel = this.client.channels.cache.get(
            this.account.spamChannelId,
        );
        if (!channel || !channel.isText()) return false;

        if (type === "say") {
            (channel as any).send(payload).catch((e: any) => console.error("Say error", e));
            return true;
        }

        if (type === "market_buy") {
            (channel as any).send(`<@716390085896962058> m b ${payload}`).catch((e: any) => console.error("Market error", e));
            return true;
        }

        if (type === "click") {
            this.log(`Manual click requested for ${payload}`, "info");
            return true;
        }

        return false;
    }

    public resume() {
        this.isCaptcha = false;
        storage.updateAccount(this.account.id, {
            status: "running",
            captchaUrl: null,
        });
        this.startSpam();
        this.log("Resumed manually.", "success");
    }
}
