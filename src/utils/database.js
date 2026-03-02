const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("✕ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file!");
  console.log("\n▫ Setup Instructions:");
  console.log("1. Go to https://supabase.com and create a new project");
  console.log("2. Go to Project Settings > API");
  console.log("3. Copy the Project URL and anon key to .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Set the default chart for a guild
 * @param {string} guildId - Discord guild ID
 * @param {number|null} chartId - Chart ID or null to reset
 */
async function setDefaultChart(guildId, chartId) {
  const { error } = await supabase
    .from("guild_settings")
    .upsert({ guild_id: guildId, default_chart_id: chartId }, { onConflict: "guild_id" });

  if (error) throw error;
}

/**
 * Get the default chart ID for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<number|null>} Chart ID or null if using built-in default
 */
async function getDefaultChartId(guildId) {
  const { data, error } = await supabase
    .from("guild_settings")
    .select("default_chart_id")
    .eq("guild_id", guildId)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data?.default_chart_id || null;
}

/**
 * Get or create a chart by name for a guild
 * @param {string} name - Chart name
 * @param {string} guildId - Discord guild ID
 * @param {string} createdBy - User ID who created it
 * @returns {Promise<Object>} Chart object with id, name, guild_id
 */
async function getOrCreateChart(name, guildId, createdBy) {
  const normalizedName = name.toLowerCase().trim();

  // Try to get existing chart
  const { data: existingChart, error: selectError } = await supabase
    .from("charts")
    .select("*")
    .ilike("name", normalizedName)
    .eq("guild_id", guildId)
    .single();

  if (selectError && selectError.code !== "PGRST116") throw selectError;

  if (existingChart) {
    return existingChart;
  }

  // Create new chart
  const { data: newChart, error: insertError } = await supabase
    .from("charts")
    .insert({ name: name.trim(), guild_id: guildId, created_by: createdBy })
    .select()
    .single();

  if (insertError) throw insertError;
  return newChart;
}

/**
 * Get a chart by name for a guild
 * @param {string} name - Chart name
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Object|null>} Chart object or null
 */
async function getChart(name, guildId) {
  const normalizedName = name.toLowerCase().trim();
  const { data, error } = await supabase
    .from("charts")
    .select("*")
    .ilike("name", normalizedName)
    .eq("guild_id", guildId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Get a chart by ID
 * @param {number} chartId - Chart ID
 * @returns {Promise<Object|null>} Chart object or null
 */
async function getChartById(chartId) {
  const { data, error } = await supabase
    .from("charts")
    .select("*")
    .eq("id", chartId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Get all charts for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Array>} Array of chart objects with entry counts
 */
async function getAllCharts(guildId) {
  const { data: charts, error } = await supabase
    .from("charts")
    .select("*, chart_entries(count)")
    .eq("guild_id", guildId)
    .order("name");

  if (error) throw error;

  // Transform to match old format
  return (charts || []).map(chart => ({
    ...chart,
    entry_count: chart.chart_entries?.[0]?.count || 0
  }));
}

/**
 * Add a timezone entry to a chart
 * @param {number} chartId - Chart ID
 * @param {string} label - Display label (e.g., "🇮🇳 India (Mumbai)")
 * @param {string} timezone - IANA timezone (e.g., "Asia/Kolkata")
 * @param {string} addedBy - User ID who added it
 * @returns {Promise<Object>} Result with success status
 */
async function addChartEntry(chartId, label, timezone, addedBy) {
  const { error } = await supabase
    .from("chart_entries")
    .insert({ chart_id: chartId, label, timezone, added_by: addedBy });

  if (error) {
    if (error.code === "23505") { // Unique constraint violation
      return { success: false, error: "This timezone is already in the chart" };
    }
    throw error;
  }
  return { success: true };
}

/**
 * Remove a timezone entry from a chart
 * @param {number} chartId - Chart ID
 * @param {string} timezone - IANA timezone to remove
 * @returns {Promise<Object>} Result with success status and changes count
 */
async function removeChartEntry(chartId, timezone) {
  const { data, error } = await supabase
    .from("chart_entries")
    .delete()
    .eq("chart_id", chartId)
    .eq("timezone", timezone)
    .select();

  if (error) throw error;
  return { success: data && data.length > 0, changes: data?.length || 0 };
}

/**
 * Get all entries for a chart
 * @param {number} chartId - Chart ID
 * @returns {Promise<Array>} Array of { label, zone } objects
 */
async function getChartEntries(chartId) {
  const { data, error } = await supabase
    .from("chart_entries")
    .select("label, timezone")
    .eq("chart_id", chartId)
    .order("added_at");

  if (error) throw error;

  // Transform to match old format (zone instead of timezone)
  return (data || []).map(entry => ({
    label: entry.label,
    zone: entry.timezone
  }));
}

/**
 * Delete a chart and all its entries
 * @param {number} chartId - Chart ID
 * @returns {Promise<Object>} Result with success status
 */
async function deleteChart(chartId) {
  // Delete entries first (cascade should handle this, but being explicit)
  await supabase.from("chart_entries").delete().eq("chart_id", chartId);

  const { data, error } = await supabase
    .from("charts")
    .delete()
    .eq("id", chartId)
    .select();

  if (error) throw error;
  return { success: data && data.length > 0 };
}

/**
 * Get the time format preference for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<string>} '12h' or '24h' (defaults to '24h')
 */
async function getTimeFormat(guildId) {
  const { data, error } = await supabase
    .from("guild_settings")
    .select("time_format")
    .eq("guild_id", guildId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data?.time_format || "24h";
}

/**
 * Set the time format preference for a guild
 * @param {string} guildId - Discord guild ID
 * @param {string} format - '12h' or '24h'
 */
async function setTimeFormat(guildId, format) {
  const { error } = await supabase
    .from("guild_settings")
    .upsert({ guild_id: guildId, time_format: format }, { onConflict: "guild_id" });

  if (error) throw error;
}

// ============================================
// Scheduled Events Functions
// ============================================

/**
 * Add a new scheduled event
 * @param {string} guildId - Discord guild ID
 * @param {number|null} chartId - Chart ID or null for guild-wide
 * @param {string} name - Event name
 * @param {string|null} description - Optional description
 * @param {Date} eventTime - Event time as Date object
 * @param {string} timezone - Original timezone
 * @param {string} createdBy - User ID who created it
 * @returns {Promise<Object>} Created event
 */
async function addEvent(guildId, chartId, name, description, eventTime, timezone, createdBy) {
  const { data, error } = await supabase
    .from("scheduled_events")
    .insert({
      guild_id: guildId,
      chart_id: chartId,
      name,
      description,
      event_time: eventTime.toISOString(),
      timezone,
      created_by: createdBy
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get upcoming events for a guild
 * @param {string} guildId - Discord guild ID
 * @param {number|null} chartId - Optional chart filter
 * @returns {Promise<Array>} Array of events
 */
async function getEvents(guildId, chartId = null) {
  let query = supabase
    .from("scheduled_events")
    .select("*, charts(name)")
    .eq("guild_id", guildId)
    .gte("event_time", new Date().toISOString())
    .order("event_time", { ascending: true });

  if (chartId !== null) {
    query = query.eq("chart_id", chartId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get all events for a guild (including past)
 * @param {string} guildId - Discord guild ID
 * @returns {Promise<Array>} Array of events
 */
async function getAllEvents(guildId) {
  const { data, error } = await supabase
    .from("scheduled_events")
    .select("*, charts(name)")
    .eq("guild_id", guildId)
    .order("event_time", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get an event by ID
 * @param {number} eventId - Event ID
 * @returns {Promise<Object|null>} Event object or null
 */
async function getEventById(eventId) {
  const { data, error } = await supabase
    .from("scheduled_events")
    .select("*, charts(name)")
    .eq("id", eventId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Remove an event
 * @param {number} eventId - Event ID
 * @param {string} guildId - Guild ID for verification
 * @returns {Promise<Object>} Result with success status
 */
async function removeEvent(eventId, guildId) {
  const { data, error } = await supabase
    .from("scheduled_events")
    .delete()
    .eq("id", eventId)
    .eq("guild_id", guildId)
    .select();

  if (error) throw error;
  return { success: data && data.length > 0, deleted: data?.[0] };
}

/**
 * Get upcoming events for display as tags
 * @param {string} guildId - Discord guild ID
 * @param {number|null} chartId - Chart ID (also includes guild-wide events)
 * @param {number} hoursAhead - How many hours ahead to look (default 168 = 1 week)
 * @returns {Promise<Array>} Array of upcoming events
 */
async function getUpcomingEventsForChart(guildId, chartId = null, hoursAhead = 168) {
  const now = new Date();
  const futureLimit = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

  let query = supabase
    .from("scheduled_events")
    .select("*")
    .eq("guild_id", guildId)
    .gte("event_time", now.toISOString())
    .lte("event_time", futureLimit.toISOString())
    .order("event_time", { ascending: true });

  // Get guild-wide events (chart_id is null) OR chart-specific events
  if (chartId !== null) {
    query = query.or(`chart_id.is.null,chart_id.eq.${chartId}`);
  } else {
    query = query.is("chart_id", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================
// Worldclock Functions
// ============================================

/**
 * Save a worldclock live message
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Channel ID
 * @param {string} messageId - Message ID
 * @param {number|null} chartId - Optional chart ID
 * @param {string} createdBy - User who started it
 */
async function addWorldclock(guildId, channelId, messageId, chartId, createdBy) {
  const { data, error } = await supabase
    .from("worldclock_messages")
    .upsert({
      guild_id: guildId,
      channel_id: channelId,
      message_id: messageId,
      chart_id: chartId,
      created_by: createdBy
    }, { onConflict: "guild_id,channel_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove a worldclock from a channel
 * @param {string} guildId - Guild ID
 * @param {string} channelId - Channel ID
 */
async function removeWorldclock(guildId, channelId) {
  const { data, error } = await supabase
    .from("worldclock_messages")
    .delete()
    .eq("guild_id", guildId)
    .eq("channel_id", channelId)
    .select();

  if (error) throw error;
  return { success: data && data.length > 0, deleted: data?.[0] };
}

/**
 * Get all active worldclock messages
 * @returns {Promise<Array>} Array of worldclock entries
 */
async function getActiveWorldclocks() {
  const { data, error } = await supabase
    .from("worldclock_messages")
    .select("*");

  if (error) throw error;
  return data || [];
}

// ============================================
// Reminder Functions
// ============================================

/**
 * Add a user reminder
 * @param {string} userId - Discord user ID
 * @param {string|null} guildId - Guild ID where set
 * @param {string|null} channelId - Channel ID where set
 * @param {string} reminderText - Reminder message
 * @param {Date} remindAt - When to fire
 * @param {string} timezone - User's timezone
 */
async function addReminder(userId, guildId, channelId, reminderText, remindAt, timezone) {
  const { data, error } = await supabase
    .from("user_reminders")
    .insert({
      user_id: userId,
      guild_id: guildId,
      channel_id: channelId,
      reminder_text: reminderText,
      remind_at: remindAt.toISOString(),
      timezone
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get pending reminders for a user
 * @param {string} userId - Discord user ID
 */
async function getUserReminders(userId) {
  const { data, error } = await supabase
    .from("user_reminders")
    .select("*")
    .eq("user_id", userId)
    .eq("fired", false)
    .order("remind_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Cancel a reminder
 * @param {number} reminderId - Reminder ID
 * @param {string} userId - User ID for verification
 */
async function cancelReminder(reminderId, userId) {
  const { data, error } = await supabase
    .from("user_reminders")
    .delete()
    .eq("id", reminderId)
    .eq("user_id", userId)
    .select();

  if (error) throw error;
  return { success: data && data.length > 0, deleted: data?.[0] };
}

/**
 * Get all due (unfired) reminders
 * @returns {Promise<Array>} Reminders that should fire now
 */
async function getDueReminders() {
  const { data, error } = await supabase
    .from("user_reminders")
    .select("*")
    .eq("fired", false)
    .lte("remind_at", new Date().toISOString());

  if (error) throw error;
  return data || [];
}

/**
 * Mark a reminder as fired
 * @param {number} reminderId - Reminder ID
 */
async function markReminderFired(reminderId) {
  const { error } = await supabase
    .from("user_reminders")
    .update({ fired: true })
    .eq("id", reminderId);

  if (error) throw error;
}

// ============================================
// User Uptime Functions
// ============================================

/**
 * Set user's uptime/awake hours
 * @param {string} userId - Discord user ID
 * @param {string} timezone - IANA timezone
 * @param {string} cityLabel - City display label
 * @param {number} awakeStart - Hour (0-23) when user wakes
 * @param {number} awakeEnd - Hour (0-23) when user sleeps
 */
async function setUserUptime(userId, timezone, cityLabel, awakeStart, awakeEnd) {
  const { data, error } = await supabase
    .from("user_uptime")
    .upsert({
      user_id: userId,
      timezone,
      city_label: cityLabel,
      awake_start: awakeStart,
      awake_end: awakeEnd,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get a user's uptime settings
 * @param {string} userId - Discord user ID
 */
async function getUserUptime(userId) {
  const { data, error } = await supabase
    .from("user_uptime")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data || null;
}

/**
 * Get uptime for multiple users
 * @param {string[]} userIds - Array of user IDs
 */
async function getUptimeForUsers(userIds) {
  if (!userIds || userIds.length === 0) return [];

  const { data, error } = await supabase
    .from("user_uptime")
    .select("*")
    .in("user_id", userIds);

  if (error) throw error;
  return data || [];
}

/**
 * Get all uptime entries (for server-wide whoisawake)
 */
async function getAllUptime() {
  const { data, error } = await supabase
    .from("user_uptime")
    .select("*");

  if (error) throw error;
  return data || [];
}

module.exports = {
  supabase,
  getOrCreateChart,
  getChart,
  getChartById,
  getAllCharts,
  addChartEntry,
  removeChartEntry,
  getChartEntries,
  deleteChart,
  setDefaultChart,
  getDefaultChartId,
  getTimeFormat,
  setTimeFormat,
  // Event functions
  addEvent,
  getEvents,
  getAllEvents,
  getEventById,
  removeEvent,
  getUpcomingEventsForChart,
  // Worldclock functions
  addWorldclock,
  removeWorldclock,
  getActiveWorldclocks,
  // Reminder functions
  addReminder,
  getUserReminders,
  cancelReminder,
  getDueReminders,
  markReminderFired,
  // Uptime functions
  setUserUptime,
  getUserUptime,
  getUptimeForUsers,
  getAllUptime,
};
