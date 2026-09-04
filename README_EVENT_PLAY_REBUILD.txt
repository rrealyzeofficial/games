SHINE WITHOUT END — PLAY / EVENT PLAY REBUILD

1) PLAY GỐC
- index(2).html + java(2).js + style(2).css remain the main game.
- NOW PLAY -> TEAM SELECT -> START PLAY still redirects to gameplay.html.
- gameplay.html is standalone and keeps the original rhythm lane/note gameplay flow.
- Back/result from gameplay.html returns to index(2).html?return=nowplay, never login.

2) EVENT PLAY
- Event Play is completely separate: event-play.html / event-play.js / event-play.css.
- It does NOT replace or modify the original PLAY rhythm engine.
- Team: 3 main characters + 1 event-special character.
- Current event characters supported: Lumina, Akito, Kohane, Hatsune Miku (assets/miku.png).
- 20 turns; each side has Vocal/Rap/Act score bars.
- First side is determined by the highest Battle Power character on either side.
- 3 skills per character plus a 100% energy special skill for the event-special character.
- Training: AI, no Event Points and no energy cost.
- Player Match: finds another registered profile through Supabase profiles and awards Event Points on victory.
- Energy selection 1..10. Victory Event Points = 1,349 + 550 * (energy - 1).
- Event Energy is consumed only when a player match finishes.

3) EVENT REWARDS / MAILBOX
- Event max points = 1,000,000.
- Required Kohane milestones: 150,000 / 250,000 / 400,000 / 650,000 / 850,000.
- Required card milestones: 100,000 / 300,000 / 500,000 / 700,000 / 900,000.
- Milestone rewards are delivered to the Event Mailbox on the lobby below Daily Check-in.
- Claiming a reward applies it to the player's inventory; repeated Kohane milestones increase her rank (up to Rank 5).

4) SUPABASE
- event-play.html loads supabase-config.js from the same folder.
- Player matchmaking reads registered profiles from the existing profiles table.
- If the profiles table is protected by RLS, expose only the fields needed by your existing app policies.
- If no other registered profile is visible, Player Match stops and tells the player to use Training.

5) ASSETS
Keep the existing assets folder next to these files. Event Play expects:
assets/lumina.png
assets/akito.png
assets/kohane.png
assets/miku.png
assets/event1.png
and the existing rhythm audio files used by gameplay.html.
