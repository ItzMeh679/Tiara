-- =============================================
-- Supabase Database Schema for TimeBot
-- Run this in Supabase SQL Editor
-- =============================================

-- Charts table
CREATE TABLE IF NOT EXISTS charts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, guild_id)
);

-- Chart entries table
CREATE TABLE IF NOT EXISTS chart_entries (
  id SERIAL PRIMARY KEY,
  chart_id INTEGER NOT NULL REFERENCES charts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  timezone TEXT NOT NULL,
  added_by TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chart_id, timezone)
);

-- Guild settings table
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  default_chart_id INTEGER REFERENCES charts(id) ON DELETE SET NULL,
  time_format TEXT DEFAULT '24h'
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_charts_guild_id ON charts(guild_id);
CREATE INDEX IF NOT EXISTS idx_chart_entries_chart_id ON chart_entries(chart_id);

-- User timezones table (for /mytime command)
CREATE TABLE IF NOT EXISTS user_timezones (
  user_id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL,
  city_label TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled events table (for calendar/event feature)
CREATE TABLE IF NOT EXISTS scheduled_events (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  chart_id INTEGER REFERENCES charts(id) ON DELETE CASCADE,  -- NULL = guild-wide event
  name TEXT NOT NULL,
  description TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,  -- Original timezone for display
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_events_guild ON scheduled_events(guild_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_time ON scheduled_events(event_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_events_chart ON scheduled_events(chart_id);

-- Worldclock live-updating messages
CREATE TABLE IF NOT EXISTS worldclock_messages (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  chart_id INTEGER REFERENCES charts(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_worldclock_guild ON worldclock_messages(guild_id);

-- User reminders (user-based, cross-guild)
CREATE TABLE IF NOT EXISTS user_reminders (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  guild_id TEXT,
  channel_id TEXT,
  reminder_text TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fired BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON user_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON user_reminders(remind_at) WHERE fired = FALSE;

-- User uptime / awake hours
CREATE TABLE IF NOT EXISTS user_uptime (
  user_id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL,
  city_label TEXT NOT NULL,
  awake_start INTEGER NOT NULL DEFAULT 7,
  awake_end INTEGER NOT NULL DEFAULT 23,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User chat profiles (for Myra AI personality adaptation)
CREATE TABLE IF NOT EXISTS user_chat_profiles (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  style_notes TEXT,
  message_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
-- ALTER TABLE charts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chart_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE guild_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_timezones ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE worldclock_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_uptime ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_chat_profiles ENABLE ROW LEVEL SECURITY;

