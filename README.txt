SHINE WITHOUT END EVENT UPDATE

Clean filenames: index.html, style.css, java.js, gameplay.html, gameplay.js, event-play.html, event-play.css, event-play.js.

PLAY ORIGINAL: index.html -> gameplay.html remains separate.
EVENT PLAY: event-play.html is separate.

IMPORTANT ASSETS expected in assets/: miku.png, hb.mp3, fl.mp3, bg.mp3, lumina.png, akito.png, kohane.png, event1.png, plus original assets.

Supabase: keep your existing supabase-config.js beside these HTML files. Run supabase_event_matchmaking.sql once to create the realtime matchmaking tables/RPCs.

Event matchmaking only matches players choosing the same song. Training uses AI and gives no points/energy. Player Match consumes selected energy only when the player wins.

V8 changes:
- Fixed remote turn waiting state so skill buttons only appear on your actual turn.
- Added authoritative Player Match turn validation in SQL.
- Added separate per-player score syncing for Vocal/Rap/Act.
- Added active-character panel above Skills with image, name, stars, BP, level/rank and WAIT FOR YOUR TURN state.
- Added RESUME / LEAVE confirmation when backing out of an active Event Battle.
- Added Player Match forfeit handling: both clients return to Event lobby; the remaining player receives 1/2 Event Points.
- Added World Rank TOP 100 sorted by Event Points, with ID, Event LVL and Event Points.
- Plain reload while logged in now returns to the MAIN lobby. Explicit return=event still opens Event lobby.
- event-play.js uses cache-busting query v8.
- Run the updated supabase_event_matchmaking.sql in Supabase SQL Editor.


V9 changes:
- Event battle turn display now uses two side-by-side character slots: active side shows the real character art, waiting side shows a generic person icon.
- Added HATSUNE MIKU "RADIANT BRIDE" limited 6★ RAP banner using assets/miku1.png. LUMINA remains in the character database for existing owners but is no longer rollable from the new character banner.
- Miku: 21,250 base BP, +620/level; normal reward skill +35%; Event skills include +2,780 RAP, choose-one next-turn boost, and advance the other two allied turns before the rival.
- Player Match Event Points: 3,210 at 1 Energy, +1,426 per additional Energy.
- Main lobby Energy resource added beside Gold. Natural recovery: 1 Energy / 90 seconds, naturally capped at 100; shop purchases can exceed 100.
- Energy shop: 50 for 100 Gems, 100 for 220 Gems, 200 for 360 Gems.
- Gold success notification redesigned to match the Gems success notification.
- supabase_event_matchmaking.sql keeps the rerunnable Realtime/policy fixes from V8 and uses the new Player Match reward formula for forfeits.
