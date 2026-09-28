export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface BotState {
  id: number;
  facebook_connected: boolean;
  facebook_user_name: string | null;
  session_active: boolean;
  bot_running: boolean;
  login_in_progress: boolean;
  login_error: string | null;
  last_connected_at: string | null;
  last_disconnected_at: string | null;
  updated_at: string;
}

export interface BotLog {
  id: string;
  level: LogLevel;
  message: string;
  source: string | null;
  created_at: string;
}

export interface DashboardSnapshot {
  generated_at: string;
  users: {
    total_users: number | string;
    funded_users: number | string;
    wallet_circulation: number | string;
    bank_circulation: number | string;
    total_xp: number | string;
    games_played: number | string;
    wins: number | string;
  };
  economy: {
    transaction_count: number | string;
    inflow: number | string;
    outflow: number | string;
    recent_transactions: Array<{
      id: number | string;
      thread_id: string;
      user_id: string;
      type: string;
      amount: number | string;
      description: string | null;
      created_at: number | string;
    }>;
  };
  rpg: {
    players: number | string;
    active_players: number | string;
    inactive_players: number | string;
    property_holders: number | string;
    reputation: number | string;
    renown: number | string;
    classes: Array<{ character_class: string; count: number | string }>;
    regions: Array<{ region_id: string; count: number | string }>;
    recent_players: Array<{
      thread_id: string;
      user_id: string;
      character_class: string;
      subclass: string | null;
      region_id: string;
      level: number | string;
      reputation: number | string;
      renown: number | string;
      updated_at: number | string;
    }>;
  };
  guilds: {
    guilds: number | string;
    members: number | string;
    treasury: number | string;
    experience: number | string;
  };
  moderation: {
    active_warnings: number | string;
    active_bans: number | string;
    active_mutes: number | string;
    incidents_24h: number | string;
  };
  games: {
    games_played: number | string;
    wins: number | string;
    players_with_games: number | string;
  };
}

export interface DashboardRuntime {
  watchdog: Record<string, unknown> | null;
  traffic: Record<string, unknown> | null;
  music: Record<string, unknown> | null;
  uptime_seconds: number;
  node_version: string;
  memory: Record<string, number>;
}

