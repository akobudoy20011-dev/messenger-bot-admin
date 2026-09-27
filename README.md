# Messenger Bot Admin

A private admin dashboard for managing a Node.js Messenger (Facebook) bot.

## Features

- **Facebook Connection** — view connection status, reconnect, disconnect, upload a session, or submit Facebook credentials directly to ECLIPSE
- **Session Status** — monitor active chat session state
- **Bot Controls** — start and stop the bot runtime
- **Activity Logs** — local, color-coded dashboard activity logs
- **Coquette pink/lilac UI** — glassmorphism design with animations

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- lucide-react

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Configure the ECLIPSE bot API URL:

```env
VITE_ECLIPSE_API_URL=https://your-eclipse-bot.onrender.com
```

3. Start the dev server:

```bash
npm run dev
```

For Render, use:

- Build command: `npm install && npm run build`
- Start command: `npm start`

The dashboard does not require a Supabase project or Supabase environment variables.

## Runtime Connection

The dashboard talks directly to the ECLIPSE bot API. The dashboard access key is entered in the browser and kept in session storage for the current browser session.

Facebook credentials are sent directly to ECLIPSE over HTTPS and are not stored in the dashboard.

## License

Private project.
