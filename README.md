# ECLIPSE · Command Center

Private control center for the ECLIPSE Messenger bot.

## What changed

The dashboard is intentionally **not** a generic admin template anymore. It is a private ECLIPSE operating surface built around a navigable galaxy.

- Interactive galaxy background: drag to pan, scroll to zoom, and tap/double-click constellations.
- Constellations map to ECLIPSE systems: Messenger, Users, Economy, RPG, Games, Moderation, Music, Analytics, Logs, Bot Health and Settings.
- Selecting a constellation expands its command surface while the galaxy remains visible behind it.
- Dark editorial/celestial visual system using void black, moon white, dusty rose, lilac and eclipse red.
- Existing Facebook session connection, reconnect/disconnect, bot start/stop and local activity logs remain available.
- The RPG surface is shaped around the existing ECLIPSE engine: world, classes, skills, spells, guilds, companions, forge, kingdoms, armies and bosses.

## Architecture direction

The dashboard is the presentation/control layer. The Messenger bot remains the source of truth for runtime state and Neon/Postgres remains the persistent game/economy store.

```text
ECLIPSE
├── Messenger runtime
├── Command router
├── RPG engine
├── Economy
├── Games
├── Moderation
├── Music
├── Neon/Postgres
└── Command Center
    ├── Overview
    ├── Messenger
    ├── Users
    ├── Economy
    ├── RPG
    ├── Games
    ├── Moderation
    ├── Music
    ├── Analytics
    ├── Logs
    ├── Bot Health
    └── Settings
```

The current frontend consumes the existing dashboard status/control API. New analytics/RPG/economy read endpoints should be added to the bot API incrementally rather than duplicating game logic in the dashboard.

## Run

```bash
npm install
npm run dev
```

Configure:

```env
VITE_ECLIPSE_API_URL=https://your-eclipse-bot.onrender.com
```

The dashboard key is kept in browser session storage for the active session.

## Render

Build:

```bash
npm install && npm run build
```

Start:

```bash
npm start
```