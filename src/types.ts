export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface BotState {
  id: number;
  facebook_connected: boolean;
  facebook_user_name: string | null;
  session_active: boolean;
  bot_running: boolean;
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
