SHINE WITHOUT END EVENT UPDATE

Clean filenames: index.html, style.css, java.js, gameplay.html, gameplay.js, event-play.html, event-play.css, event-play.js.

PLAY ORIGINAL: index.html -> gameplay.html remains separate.
EVENT PLAY: event-play.html is separate.

IMPORTANT ASSETS expected in assets/: miku.png, hb.mp3, fl.mp3, bg.mp3, lumina.png, akito.png, kohane.png, event1.png, plus original assets.

Supabase: keep your existing supabase-config.js beside these HTML files. Run supabase_event_matchmaking.sql once to create the realtime matchmaking tables/RPCs.

Event matchmaking only matches players choosing the same song. Training uses AI and gives no points/energy. Player Match consumes selected energy only when the player wins.
