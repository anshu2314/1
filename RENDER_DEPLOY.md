# Render Deployment Guide

To deploy this application on Render, follow these steps:

## 1. Prepare Your Database
- Use your existing Aiven PostgreSQL database.
- Ensure the `sslmode=require` parameter is included in your `DATABASE_URL`.

## 2. Create a Web Service on Render
- **Repository:** Connect your GitHub/GitLab repository.
- **Runtime:** `Node`.
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run db:push && npm start`

## 3. Environment Variables
Add the following variables in the Render dashboard:
- `DATABASE_URL`: `postgres://avnadmin:...@...:19216/defaultdb?sslmode=require`
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render's default)
- `SESSION_SECRET`: A random secure string for session management.

## 4. Troubleshooting
- **Bot Not Catching:** Ensure the `token` provided for each account is a valid Discord user token and that the bot has access to the configured `catch_channel_id`.
- **Database Errors:** Verify that the Aiven database allows connections from Render's IP range or is set to allow all (development only).

## Features
- **Spammer:** Random word spamming with adjustable speed.
- **Hint/Catcher:** Reliable detection of Pokétwo spawns and P2A predictions.
- **Captcha Center:** Pause and resume automation when human verification is required.
- **Multi-Account Dashboard:** Manage all units from a single interface.
