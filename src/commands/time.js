const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getDefaultTimeList, generateTimeList, generateInlineFields, DEFAULT_TIME_ZONES, formatEventForMultipleTimezones } = require("../utils/timezones");
const { getDefaultChartId, getChartEntries, getChartById, getTimeFormat, getUpcomingEventsForChart } = require("../utils/database");
const { DateTime } = require("luxon");

/**
 * Generate event tags string for embed
 * @param {Array} events - Array of event objects
 * @param {string} timeFormat - '12h' or '24h'
 * @param {Array} chartEntries - Optional chart entries for multi-timezone display
 */
function generateEventTags(events, timeFormat, chartEntries = null) {
    if (!events || events.length === 0) return null;

    const now = DateTime.now();

    const tags = events.slice(0, 3).map(event => {
        const time = DateTime.fromISO(event.event_time).setZone(event.timezone);
        const isToday = time.hasSame(now, "day");
        const isTomorrow = time.hasSame(now.plus({ days: 1 }), "day");

        let dateLabel = time.toFormat("MMM d");
        if (isToday) dateLabel = "Today";
        else if (isTomorrow) dateLabel = "Tomorrow";

        // If chart entries provided, show multi-timezone
        if (chartEntries && chartEntries.length > 0) {
            const multiTz = formatEventForMultipleTimezones(
                event.event_time,
                event.timezone,
                chartEntries.map(e => ({ label: e.label, zone: e.zone })),
                timeFormat
            );
            return `▸ **${event.name}** · ${dateLabel}\n${multiTz}`;
        } else {
            const timeStr = timeFormat === '12h'
                ? time.toFormat("h:mm a")
                : time.toFormat("HH:mm");
            return `▸ **${event.name}** · ${dateLabel} │ \`${timeStr}\``;
        }
    });

    let result = tags.join("\n\n");
    if (events.length > 3) {
        result += `\n\n_+${events.length - 3} more events..._`;
    }
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("time")
        .setDescription("Show the default world time chart")
        .addStringOption(option =>
            option.setName("view")
                .setDescription("Display style")
                .setRequired(false)
                .addChoices(
                    { name: "Detailed (with dates)", value: "detailed" },
                    { name: "Compact (time only)", value: "compact" },
                    { name: "Grid (inline fields)", value: "grid" }
                )),

    async execute(interaction) {
        try {
            const guildId = interaction.guildId;
            const view = interaction.options.getString("view") || "detailed";
            const timeFormat = guildId ? await getTimeFormat(guildId) : '24h';

            // Check for custom default chart
            let title = "◷ World Times";
            let entries = DEFAULT_TIME_ZONES;
            let footer = "Use /setdefault to set a custom chart";
            let chartId = null;

            if (guildId) {
                const defaultChartId = await getDefaultChartId(guildId);
                if (defaultChartId) {
                    const chartEntries = await getChartEntries(defaultChartId);
                    if (chartEntries && chartEntries.length > 0) {
                        const chartInfo = await getChartById(defaultChartId);
                        if (chartInfo) {
                            title = `◷ ${chartInfo.name}`;
                            entries = chartEntries;
                            footer = "/setdefault to change │ /chart <name> for others";
                            chartId = defaultChartId;
                        }
                    }
                }
            }

            // Get upcoming events
            let eventTagsStr = null;
            if (guildId) {
                const upcomingEvents = await getUpcomingEventsForChart(guildId, chartId);
                // Pass entries for multi-timezone display if using a chart
                eventTagsStr = generateEventTags(upcomingEvents, timeFormat, chartId ? entries : null);
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setFooter({ text: footer })
                .setTimestamp();

            if (view === "grid") {
                embed.setTitle(title);
                if (eventTagsStr) {
                    embed.setDescription(eventTagsStr + "\n\n───────────────");
                }
                embed.addFields(generateInlineFields(entries, timeFormat));
            } else {
                embed.setTitle(title);
                let desc = generateTimeList(entries, timeFormat, view);
                if (eventTagsStr) {
                    desc = eventTagsStr + "\n\n───────────────\n\n" + desc;
                }
                embed.setDescription(desc);
            }

            // Create button controller with aesthetic icons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`refresh_time_${view}_${chartId || 'default'}`)
                        .setLabel("↻ Refresh")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_compact_${chartId || 'default'}`)
                        .setLabel("◇ Compact")
                        .setStyle(view === 'compact' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_detailed_${chartId || 'default'}`)
                        .setLabel("◈ Detailed")
                        .setStyle(view === 'detailed' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_grid_${chartId || 'default'}`)
                        .setLabel("▦ Grid")
                        .setStyle(view === 'grid' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error("Time command error:", error);
            return interaction.reply({
                content: "❌ An error occurred while fetching time. Please try again.",
                ephemeral: true,
            });
        }
    },
};

