## Project Overview
This is a Discord Pokétwo Catcher Dashboard designed for multi-account automation.

### Key Features
- **Multi-Account Support:** Manage multiple Discord accounts.
- **Auto-Spammer:** Trigger spawns by sending random messages.
- **Auto-Catcher:** Advanced detection and catching using Pokétwo hints, Sierra predictions, and P2 Assistant.
- **Captcha Handling:** Pauses bot on captcha detection for manual resolution.
- **Market & Say Commands:** Instant execution of Discord commands.

### Recent Technical Updates (February 18, 2026)
- **Sierra Bot Detection:** Added support for bot ID `696161886734909481`. Detects Pokémon names from embeds.
- **P2 Assistant Enhancements:** Added support for bot ID `854233015475109888`. Handles multiple Pokémon name predictions with a 6-second delay between catch commands.
- **Database Connectivity:** Fixed SSL connection issues for external databases (Aiven) by setting `rejectUnauthorized: false`.
- **Render Deployment Fixes:** Optimized `package.json` dependencies and `render.yaml` build/start commands to ensure compatibility with Render's environment.
- **Channel Validation:** Bots now strictly catch Pokémon only in their configured channels to prevent cross-account interference.