# Messenger Bot Admin

A private admin dashboard for managing a Node.js Messenger (Facebook) bot.

## Features

- **Facebook Connection** — view connection status, reconnect and disconnect
- **Session Status** — monitor active chat session state
- **Bot Controls** — start and stop the bot runtime
- **Activity Logs** — live, color-coded log feed with realtime updates via Supabase
- **Coquette pink/lilac UI** — glassmorphism design with animations

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (database + realtime subscriptions)
- lucide-react icons

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.

3. Run the SQL migration in `supabase/migrations/` against your Supabase project to create the `bot_state` and `bot_logs` tables with RLS policies.

4. Start the dev server:

```bash
npm run dev
```

## Database

The dashboard uses two Supabase tables:

- `bot_state` — singleton row holding Facebook connection, session, and bot running status
- `bot_logs` — append-only log entries (info / warn / error / success)

Both tables have Row Level Security enabled with anon-accessible policies (single-tenant, no auth).

## License

Private project.
