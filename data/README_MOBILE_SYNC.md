# REALYZE!! — Mobile + Account Sync

## What changed
- Separate **LUMINA Character Gacha** banner.
- Character drops go to **MY CHARACTERS**, not MY CARD.
- MY CHARACTERS now shows owned characters and lets the player choose the active character.
- The selected character is remembered in the account and loaded again when entering Team Select.
- Gameplay HUD shows the selected character.
- Embedded gameplay now supports **D/F/J/K** and **touch/pointer lane taps**.
- Landscape-phone responsive layout and PWA manifest were added.
- Character banner has a separate **Character Pity** with LUMINA guaranteed on the 100th character-banner pull.
- Item banner pity remains separate from character pity.
- Account sync API is included in `server.js`; localStorage remains as an offline cache/fallback.

## Run online account sync locally
Requires Node.js 18+.

```bash
npm start
```

Open `http://localhost:3000`.

The browser can then use the same account on another device **when both devices access the deployed server URL**. Do not use `file:///...` for the online-sync version.

## Deployment
Deploy the whole folder to a Node.js host that runs:

```bash
npm start
```

The server stores account/game data in `data/users.json`. Keep that file private and make sure the host provides persistent storage.

## Important
The current project is still a prototype. The server uses a lightweight built-in session system and JSON storage so it can be deployed without extra npm packages. For a production-scale game, move accounts/game state to a real database and add stronger session/security controls.
