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
    recent_users: Array<{
      thread_id: string;
      user_id: string;
      display_name: string | null;
      balance: number | string;
      bank_balance: number | string;
      xp: number | string;
      level: number | string;
      games_played: number | string;
      wins: number | string;
    }>;
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
    inventory_items: number | string;
    equipment: number | string;
    pets: number | string;
    active_combat: number | string;
    active_dungeons: number | string;
    battles_24h: number | string;
    active_world_bosses: number | string;
    active_guild_raids: number | string;
    active_world_events: number | string;
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
    recent_guilds: Array<{
      id: number | string;
      thread_id: string;
      guild_id: string;
      name: string;
      level: number | string;
      treasury: number | string;
      experience: number | string;
      members: number | string;
    }>;
  };
  moderation: {
    active_warnings: number | string;
    active_bans: number | string;
    active_mutes: number | string;
    incidents_24h: number | string;
    recent_incidents: Array<{
      id: number | string;
      thread_id: string;
      user_id: string;
      category: string;
      severity: number | string;
      confidence: number | string;
      suggested_action: string;
      action: string;
      reason: string | null;
      created_at: number | string;
    }>;
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
  database: boolean | null;
}


export interface DashboardEvent {
  id: string;
  type: string;
  message: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface DashboardAnalytics {
  generated_at: string;
  hours: number;
  economy: Array<{
    bucket: string;
    inflow: number | string;
    outflow: number | string;
    transactions: number | string;
  }>;
  rpg: Array<{
    bucket: string;
    players: number | string;
    reputation: number | string;
    renown: number | string;
  }>;
  battles: Array<{
    bucket: string;
    battles: number | string;
  }>;
  moderation: Array<{
    bucket: string;
    incidents: number | string;
  }>;
}

export interface DashboardUserInspector {
  generated_at: string;
  user: Record<string, unknown> | null;
  rpg: Record<string, unknown> | null;
  inventory: Array<Record<string, unknown>>;
  equipment: Array<Record<string, unknown>>;
  skills: Array<Record<string, unknown>>;
  spells: Array<Record<string, unknown>>;
  pets: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
  moderation: Array<Record<string, unknown>>;
}
