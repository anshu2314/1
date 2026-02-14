
# Discord Pokétwo Catcher Dashboard

A multi-account automation cockpit for Pokétwo on Discord. Built for deployment on Render.

## Features

- **Multi-Account Management:** Add and manage multiple Discord accounts (tokens).
- **Spammer:** Auto-send random messages to trigger spawns.
- **Auto-Catcher:** Automatically catches Pokémon spawned by Pokétwo (including hints).
- **Dashboard:** Real-time stats, logs, and controls.
- **Captcha Center:** Detects captchas and allows manual solving via the dashboard.
- **Say Command:** Send messages from any account.
- **Market Buyer:** Auto-buy and confirm market items.
- **Statistics:** Tracks caught Pokémon, coins, shinies, legendaries, and mythicals.

## Deployment on Render

1.  Create a new Web Service on Render.
2.  Connect your repository.
3.  Use `Node` environment.
4.  Build Command: `npm install && npm run build`
5.  Start Command: `npm start`
6.  Add a Database (PostgreSQL) and link it as `DATABASE_URL`.

## Development

-   Frontend: React + Vite + Shadcn UI
-   Backend: Express + Drizzle ORM + Postgres
-   Bot Logic: discord.js-selfbot-v13

## Project Structure

-   `client/`: Frontend code.
-   `server/`: Backend code.
-   `server/bot/`: Bot logic and manager.
-   `shared/`: Shared schemas and types.
