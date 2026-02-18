# Render Deployment Guide

To deploy this application on Render, follow these steps:

## Render Deployment Steps
1. **GitHub Sync:** Push this code to your GitHub repo.
2. **Database Settings:** In Render, set `DATABASE_URL` with `?sslmode=require`.
3. **Build & Start:**
   - **Build:** `npm install && npm run build`
   - **Start:** `npx drizzle-kit push --force && node dist/index.cjs`
4. **Environment Variables:**
   - `NODE_ENV`: `production`
   - `SESSION_SECRET`: (Generate a long random string)
   - `PORT`: `10000` (Optional, Render handles this)

## Troubleshooting
- **SSL Error:** I've added `ssl: { rejectUnauthorized: false }` to the code to handle self-signed certificate errors common with external databases like Aiven.
- **tsx Not Found:** This is fixed by using `npx` or direct `node` calls in production.

## Features
- **Spammer:** Random word spamming with adjustable speed.
- **Hint/Catcher:** Reliable detection of Pokétwo spawns and P2A predictions.
- **Captcha Center:** Pause and resume automation when human verification is required.
- **Multi-Account Dashboard:** Manage all units from a single interface.
