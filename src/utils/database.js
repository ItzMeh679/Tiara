const Database = require("better-sqlite3");
const path = require("path");

// Initialize database
const dbPath = path.join(__dirname, "..", "..", "timebot.db");
const db = new Database(dbPath);

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, guild_id)
  );

  CREATE TABLE IF NOT EXISTS chart_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chart_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    timezone TEXT NOT NULL,
    added_by TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE CASCADE,
    UNIQUE(chart_id, timezone)
  );

  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    default_chart_id INTEGER,
    time_format TEXT DEFAULT '24h',
    FOREIGN KEY (default_chart_id) REFERENCES charts(id) ON DELETE SET NULL
  );
`);

// Migration: Add time_format column if it doesn't exist
try {
  db.exec(`ALTER TABLE guild_settings ADD COLUMN time_format TEXT DEFAULT '24h'`);
} catch (e) {
  // Column already exists, ignore error
}

/**
 * Set the default chart for a guild
 * @param {string} guildId - Discord guild ID
 * @param {number|null} chartId - Chart ID or null to reset
 */
function setDefaultChart(guildId, chartId) {
  db.prepare(`
    INSERT INTO guild_settings (guild_id, default_chart_id)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET default_chart_id = excluded.default_chart_id
  `).run(guildId, chartId);
}

/**
 * Get the default chart ID for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {number|null} Chart ID or null if using built-in default
 */
function getDefaultChartId(guildId) {
  const row = db.prepare(`
    SELECT default_chart_id FROM guild_settings WHERE guild_id = ?
  `).get(guildId);
  return row ? row.default_chart_id : null;
}

/**
 * Get or create a chart by name for a guild
 * @param {string} name - Chart name
 * @param {string} guildId - Discord guild ID
 * @param {string} createdBy - User ID who created it
 * @returns {Object} Chart object with id, name, guild_id
 */
function getOrCreateChart(name, guildId, createdBy) {
  const normalizedName = name.toLowerCase().trim();

  // Try to get existing chart
  let chart = db.prepare(`
    SELECT * FROM charts WHERE LOWER(name) = ? AND guild_id = ?
  `).get(normalizedName, guildId);

  if (!chart) {
    // Create new chart
    const result = db.prepare(`
      INSERT INTO charts (name, guild_id, created_by) VALUES (?, ?, ?)
    `).run(name.trim(), guildId, createdBy);

    chart = {
      id: result.lastInsertRowid,
      name: name.trim(),
      guild_id: guildId,
      created_by: createdBy
    };
  }

  return chart;
}

/**
 * Get a chart by name for a guild
 * @param {string} name - Chart name
 * @param {string} guildId - Discord guild ID
 * @returns {Object|null} Chart object or null
 */
function getChart(name, guildId) {
  const normalizedName = name.toLowerCase().trim();
  return db.prepare(`
    SELECT * FROM charts WHERE LOWER(name) = ? AND guild_id = ?
  `).get(normalizedName, guildId);
}

/**
 * Get all charts for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {Array} Array of chart objects
 */
function getAllCharts(guildId) {
  return db.prepare(`
    SELECT c.*, COUNT(e.id) as entry_count
    FROM charts c
    LEFT JOIN chart_entries e ON c.id = e.chart_id
    WHERE c.guild_id = ?
    GROUP BY c.id
    ORDER BY c.name
  `).all(guildId);
}

/**
 * Add a timezone entry to a chart
 * @param {number} chartId - Chart ID
 * @param {string} label - Display label (e.g., "🇮🇳 India (Mumbai)")
 * @param {string} timezone - IANA timezone (e.g., "Asia/Kolkata")
 * @param {string} addedBy - User ID who added it
 * @returns {Object} Result with success status
 */
function addChartEntry(chartId, label, timezone, addedBy) {
  try {
    db.prepare(`
      INSERT INTO chart_entries (chart_id, label, timezone, added_by)
      VALUES (?, ?, ?, ?)
    `).run(chartId, label, timezone, addedBy);
    return { success: true };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return { success: false, error: "This timezone is already in the chart" };
    }
    throw error;
  }
}

/**
 * Remove a timezone entry from a chart
 * @param {number} chartId - Chart ID
 * @param {string} timezone - IANA timezone to remove
 * @returns {Object} Result with success status and changes count
 */
function removeChartEntry(chartId, timezone) {
  const result = db.prepare(`
    DELETE FROM chart_entries WHERE chart_id = ? AND timezone = ?
  `).run(chartId, timezone);

  return { success: result.changes > 0, changes: result.changes };
}

/**
 * Get all entries for a chart
 * @param {number} chartId - Chart ID
 * @returns {Array} Array of { label, timezone } objects
 */
function getChartEntries(chartId) {
  return db.prepare(`
    SELECT label, timezone as zone FROM chart_entries
    WHERE chart_id = ?
    ORDER BY added_at
  `).all(chartId);
}

/**
 * Delete a chart and all its entries
 * @param {number} chartId - Chart ID
 * @returns {Object} Result with success status
 */
function deleteChart(chartId) {
  // Delete entries first (cascade should handle this, but being explicit)
  db.prepare(`DELETE FROM chart_entries WHERE chart_id = ?`).run(chartId);
  const result = db.prepare(`DELETE FROM charts WHERE id = ?`).run(chartId);
  return { success: result.changes > 0 };
}

/**
 * Get the time format preference for a guild
 * @param {string} guildId - Discord guild ID
 * @returns {string} '12h' or '24h' (defaults to '24h')
 */
function getTimeFormat(guildId) {
  const row = db.prepare(`
    SELECT time_format FROM guild_settings WHERE guild_id = ?
  `).get(guildId);
  return row?.time_format || '24h';
}

/**
 * Set the time format preference for a guild
 * @param {string} guildId - Discord guild ID
 * @param {string} format - '12h' or '24h'
 */
function setTimeFormat(guildId, format) {
  db.prepare(`
    INSERT INTO guild_settings (guild_id, time_format)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET time_format = excluded.time_format
  `).run(guildId, format);
}

module.exports = {
  db,
  getOrCreateChart,
  getChart,
  getAllCharts,
  addChartEntry,
  removeChartEntry,
  getChartEntries,
  deleteChart,
  setDefaultChart,
  getDefaultChartId,
  getTimeFormat,
  setTimeFormat,
};

