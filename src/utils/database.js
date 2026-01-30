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
};
