# replit.md

## Overview

This is a Discord Pokétwo Catcher Dashboard — a multi-account automation tool for the Pokétwo Discord bot. It provides a web-based control panel to manage multiple Discord accounts that automatically catch Pokémon, spam messages to trigger spawns, handle captchas, execute market purchases, and track statistics. The app uses Discord self-bot technology (`discord.js-selfbot-v13`) to operate user accounts programmatically.

Key features:
- **Multi-Account Management:** Add, configure, start/stop multiple Discord bot accounts
- **Auto-Spammer:** Sends random messages in configured channels to trigger Pokémon spawns
- **Auto-Catcher:** Detects and catches spawned Pokémon, including hint-based solving
- **Captcha Center:** Pauses bots on captcha detection, allows manual resolution via dashboard
- **Say Command:** Send messages from any managed account
- **Market Buyer:** Auto-purchase items from the Pokétwo market
- **Statistics Tracking:** Tracks total caught, shinies, legendaries, mythicals, coins, and balance

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite (configured in `vite.config.ts`, outputs to `dist/public`)
- **Routing:** Wouter (lightweight client-side router) with three pages: Dashboard (`/`), Activity/Logs (`/activity`), Captcha Center (`/captcha`)
- **UI Components:** Shadcn UI (new-york style) with Radix UI primitives, stored in `client/src/components/ui/`
- **Styling:** Tailwind CSS with a dark cyberpunk theme (neon purple, cyan, magenta palette). Custom CSS variables defined in `client/src/index.css`. Fonts: Orbitron (headers), Rajdhani (data/numbers), Inter (body)
- **State Management:** TanStack React Query for server state with polling intervals (2-5 second refetch for real-time updates)
- **Path Aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework:** Express.js on Node.js with TypeScript
- **Runtime:** `tsx` for development, esbuild-bundled CJS for production (`dist/index.cjs`)
- **API Design:** RESTful JSON API under `/api/` prefix. Route definitions are shared between client and server via `shared/routes.ts` using Zod schemas for type safety and validation
- **Bot Engine:** `discord.js-selfbot-v13` — each account gets its own `Bot` instance managed by a singleton `BotManager` (`server/bot/manager.ts`). Bots are restored on server restart. The manager handles start/stop/config updates/commands per account
- **Build Process:** Custom build script (`script/build.ts`) that runs Vite for frontend and esbuild for backend. Server dependencies are selectively bundled vs externalized

### Data Storage
- **Database:** PostgreSQL via `DATABASE_URL` environment variable
- **ORM:** Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema** (`shared/schema.ts`):
  - `accounts` table: stores Discord token, channel IDs, speed settings, status (stopped/running/captcha/resting), stats counters (totalCaught, totalCoins, totalShiny, totalLegendary, totalMythical, totalNormal, balance), captcha URL, timestamps
  - `logs` table: stores per-account event logs with type (info/success/warning/error), content, and timestamp
- **Migrations:** Drizzle Kit with `db:push` command for schema sync
- **Storage Layer:** `server/storage.ts` implements `IStorage` interface with `DatabaseStorage` class wrapping Drizzle queries

### API Endpoints
- `GET /api/accounts` — List all accounts
- `POST /api/accounts` — Create new account
- `GET /api/accounts/:id` — Get single account
- `PUT /api/accounts/:id` — Update account config
- `DELETE /api/accounts/:id` — Delete account
- `POST /api/accounts/:id/start` — Start bot
- `POST /api/accounts/:id/stop` — Stop bot
- `POST /api/accounts/:id/command` — Execute command (say, market_buy, click)
- `POST /api/accounts/:id/captcha` — Resolve captcha
- `GET /api/logs` — Get logs (filterable by accountId, limit)

### Static Assets
- Pokémon name lists stored in `attached_assets/` (legendary, mythical, full Pokémon list) — loaded by bot at runtime for classification
- Production static files served from `dist/public` with SPA fallback

### Dev vs Production
- **Development:** Vite dev server with HMR proxied through Express, uses `tsx` for server
- **Production:** Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`, Express serves static files

## External Dependencies

- **PostgreSQL** — Primary database, connected via `DATABASE_URL` environment variable. Required for the app to start
- **Discord API** (via `discord.js-selfbot-v13`) — Self-bot library for controlling Discord user accounts. Each managed account connects independently using user tokens
- **Pokétwo Discord Bot** — The target bot whose spawns are detected and interacted with. The app listens for Pokétwo's messages/embeds in configured channels
- **Google Fonts** — Loads Orbitron, Rajdhani, Inter, DM Sans, Fira Code, Geist Mono, and Architects Daughter fonts
- **Replit Plugins** (dev only) — `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner` for enhanced development experience on Replit