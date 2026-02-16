# Poke-Catcher Dashboard: Replit Agent Prompt

Build a Discord Pokétwo Catcher Dashboard with the following architecture and features. Ensure it is optimized for Render deployment with an external Aiven PostgreSQL database.

### 1. Core Architecture
- **Tech Stack:** Node.js (Express), React (Vite), TypeScript, Drizzle ORM, Tailwind CSS (Cyberpunk theme).
- **Discord Engine:** Use `discord.js-selfbot-v13`. Manage multiple user accounts via a singleton `BotManager`.
- **Database:** PostgreSQL (Aiven). **CRITICAL:** Use `npm run db:push --force` in the start command to sync schema on Render.
- **Render Optimization:** All build tools (`tsx`, `drizzle-kit`, `typescript`, `vite`) MUST be in `dependencies`, not `devDependencies`, to avoid "tsx: not found" errors during Render's build.

### 2. Key Features
- **Multi-Account Management:** Add/Delete accounts via Discord tokens. View real-time status.
- **Auto-Spammer:** Send random words in specific channels to trigger spawns. Configurable speed.
- **Auto-Catcher:** 
    - Detect Pokétwo spawns (embeds/messages).
    - Solve hints using a pokemon list (provided in `attached_assets`).
    - **P2A Integration:** Listen for "The pokémon is: [Name]" messages and catch immediately.
    - Implement a 5-second sequential delay for multiple P2A name predictions.
    - Handle "Hint Cooldown" by retrying every 5 seconds.
- **Captcha Center:** Pause bot on captcha detection. Show captcha image in dashboard for manual entry.
- **Market Buyer:** Auto-buy items from Pokétwo market by ID.
- **Live Logs:** Real-time event streaming for all bot actions.

### 3. Deployment Configuration (`render.yaml`)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npx drizzle-kit push --force && node dist/index.cjs`
- **Required Env Vars:** `DATABASE_URL` (with `sslmode=require`), `SESSION_SECRET`, `NODE_ENV=production`.

### 4. Safety & Performance
- No duplicate catches.
- Sequential message processing to avoid Discord rate limits.
- Robust error handling for network interruptions.
