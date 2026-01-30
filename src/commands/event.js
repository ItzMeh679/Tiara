const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { DateTime } = require("luxon");
const { searchCities, lookupCity } = require("../utils/timezones");
const {
    addEvent,
    getEvents,
    removeEvent,
    getAllCharts,
    getChart
} = require("../utils/database");

/**
 * Parse a date/time string with optional date
 * Supports formats like:
 * - "3:00 PM" (today)
 * - "15:00" (today)
 * - "Jan 31 3:00 PM"
 * - "2026-01-31 15:00"
 * - "tomorrow 3pm"
 */
function parseDateTime(input, timezone) {
    const now = DateTime.now().setZone(timezone);
    const lowerInput = input.toLowerCase().trim();

    // Handle relative dates
    let dateOffset = 0;
    let timeStr = input;

    if (lowerInput.startsWith("tomorrow")) {
        dateOffset = 1;
        timeStr = input.slice(8).trim();
    } else if (lowerInput.startsWith("today")) {
        dateOffset = 0;
        timeStr = input.slice(5).trim();
    }

    // Try parsing as full date-time
    const fullFormats = [
        "yyyy-MM-dd HH:mm",
        "yyyy-MM-dd h:mm a",
        "MMM d HH:mm",
        "MMM d h:mm a",
        "MMM d, yyyy HH:mm",
        "MMM d, yyyy h:mm a",
        "MMMM d HH:mm",
        "MMMM d h:mm a",
        "d MMM HH:mm",
        "d MMM h:mm a",
    ];

    for (const fmt of fullFormats) {
        const parsed = DateTime.fromFormat(input, fmt, { zone: timezone });
        if (parsed.isValid) {
            // If year not specified, use current or next year
            let result = parsed;
            if (!input.includes(now.year.toString())) {
                result = parsed.set({ year: now.year });
                if (result < now) {
                    result = parsed.set({ year: now.year + 1 });
                }
            }
            return result;
        }
    }

    // Try parsing as time only
    const timeFormats = ["HH:mm", "H:mm", "h:mm a", "ha", "h a", "HH"];

    for (const fmt of timeFormats) {
        const parsed = DateTime.fromFormat(timeStr.trim(), fmt, { zone: timezone });
        if (parsed.isValid) {
            let result = now.set({
                hour: parsed.hour,
                minute: parsed.minute,
                second: 0,
                millisecond: 0
            }).plus({ days: dateOffset });

            // If time is in the past today (and no date offset), assume tomorrow
            if (dateOffset === 0 && result < now) {
                result = result.plus({ days: 1 });
            }

            return result;
        }
    }

    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("event")
        .setDescription("Manage scheduled events")
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add a new event to the calendar")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Event name")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("datetime")
                        .setDescription("Date and time (start typing for suggestions!)")
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName("timezone")
                        .setDescription("Timezone for the event")
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName("chart")
                        .setDescription("Link to a specific chart (optional)")
                        .setRequired(false)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName("description")
                        .setDescription("Event description (optional)")
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List upcoming events")
                .addStringOption(option =>
                    option.setName("chart")
                        .setDescription("Filter by chart (optional)")
                        .setRequired(false)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove an event")
                .addIntegerOption(option =>
                    option.setName("id")
                        .setDescription("Event ID to remove")
                        .setRequired(true))),

    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);

            if (focusedOption.name === "datetime") {
                const input = focusedOption.value.toLowerCase();
                const now = DateTime.now();

                // Generate quick datetime suggestions
                const suggestions = [];

                // Common times for today
                const times = [
                    { h: 9, label: "9:00 AM" },
                    { h: 10, label: "10:00 AM" },
                    { h: 12, label: "12:00 PM" },
                    { h: 14, label: "2:00 PM" },
                    { h: 15, label: "3:00 PM" },
                    { h: 17, label: "5:00 PM" },
                    { h: 18, label: "6:00 PM" },
                    { h: 19, label: "7:00 PM" },
                    { h: 20, label: "8:00 PM" },
                    { h: 21, label: "9:00 PM" }
                ];

                // Today's remaining times
                for (const t of times) {
                    if (now.hour < t.h) {
                        suggestions.push({
                            name: `📅 Today at ${t.label}`,
                            value: `today ${t.label}`
                        });
                    }
                }

                // Tomorrow times
                for (const t of times.slice(0, 5)) {
                    suggestions.push({
                        name: `📆 Tomorrow at ${t.label}`,
                        value: `tomorrow ${t.label}`
                    });
                }

                // Next few days
                for (let i = 2; i <= 5; i++) {
                    const day = now.plus({ days: i });
                    suggestions.push({
                        name: `🗓️ ${day.toFormat("EEE, MMM d")} at 3:00 PM`,
                        value: `${day.toFormat("MMM d")} 3:00 PM`
                    });
                }

                // Filter based on input
                const filtered = input
                    ? suggestions.filter(s =>
                        s.name.toLowerCase().includes(input) ||
                        s.value.toLowerCase().includes(input)
                    )
                    : suggestions;

                await interaction.respond(filtered.slice(0, 25));

            } else if (focusedOption.name === "timezone") {
                const cities = searchCities(focusedOption.value, 25);
                await interaction.respond(
                    cities.map(city => ({
                        name: city.label,
                        value: city.name
                    }))
                );
            } else if (focusedOption.name === "chart") {
                const guildId = interaction.guildId;
                const charts = await getAllCharts(guildId);
                const filtered = charts
                    .filter(c => c.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .slice(0, 25);
                await interaction.respond(
                    filtered.map(chart => ({
                        name: `${chart.name} (${chart.entry_count} cities)`,
                        value: chart.name
                    }))
                );
            }
        } catch (error) {
            console.error("Autocomplete error:", error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            if (subcommand === "add") {
                const name = interaction.options.getString("name");
                const datetimeStr = interaction.options.getString("datetime");
                const timezoneCity = interaction.options.getString("timezone");
                const chartName = interaction.options.getString("chart");
                const description = interaction.options.getString("description");

                // Lookup timezone
                const cityInfo = lookupCity(timezoneCity);
                if (!cityInfo) {
                    return interaction.reply({
                        content: `❌ Timezone/city **"${timezoneCity}"** not found!`,
                        ephemeral: true
                    });
                }

                // Parse date/time
                const eventTime = parseDateTime(datetimeStr, cityInfo.zone);
                if (!eventTime) {
                    return interaction.reply({
                        content: `❌ Could not parse date/time: **"${datetimeStr}"**\n\nExamples:\n• \`3:00 PM\` (today/tomorrow)\n• \`Jan 31 3:00 PM\`\n• \`2026-01-31 15:00\`\n• \`tomorrow 3pm\``,
                        ephemeral: true
                    });
                }

                // Get chart ID if specified
                let chartId = null;
                let chartLabel = "Guild-wide";
                if (chartName) {
                    const chart = await getChart(chartName, guildId);
                    if (chart) {
                        chartId = chart.id;
                        chartLabel = chart.name;
                    }
                }

                // Create event
                const event = await addEvent(
                    guildId,
                    chartId,
                    name,
                    description,
                    eventTime.toJSDate(),
                    cityInfo.zone,
                    interaction.user.id
                );

                const embed = new EmbedBuilder()
                    .setColor(0x57f287)
                    .setTitle("📅 Event Created!")
                    .addFields(
                        { name: "Event", value: name, inline: true },
                        { name: "When", value: eventTime.toFormat("EEE, MMM d 'at' h:mm a"), inline: true },
                        { name: "Timezone", value: cityInfo.label, inline: true },
                        { name: "Scope", value: chartLabel, inline: true }
                    )
                    .setFooter({ text: `Event ID: ${event.id} • Use /calendar to view all events` })
                    .setTimestamp();

                if (description) {
                    embed.setDescription(`📝 ${description}`);
                }

                return interaction.reply({ embeds: [embed] });

            } else if (subcommand === "list") {
                const chartName = interaction.options.getString("chart");

                let chartId = null;
                let filterLabel = "All Events";
                if (chartName) {
                    const chart = await getChart(chartName, guildId);
                    if (chart) {
                        chartId = chart.id;
                        filterLabel = `Events for "${chart.name}"`;
                    }
                }

                const events = await getEvents(guildId, chartId);

                if (events.length === 0) {
                    return interaction.reply({
                        content: "📅 No upcoming events found.\n\nUse `/event add` to create one!",
                        ephemeral: true
                    });
                }

                const eventList = events.slice(0, 15).map(event => {
                    const time = DateTime.fromISO(event.event_time).setZone(event.timezone);
                    const chartTag = event.charts?.name ? ` • 📊 ${event.charts.name}` : " • 🌐 Guild-wide";
                    return `**${event.name}** (ID: ${event.id})\n📅 ${time.toFormat("EEE, MMM d 'at' h:mm a")}${chartTag}`;
                }).join("\n\n");

                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(`📅 ${filterLabel}`)
                    .setDescription(eventList)
                    .setFooter({ text: `Showing ${Math.min(events.length, 15)} of ${events.length} events` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });

            } else if (subcommand === "remove") {
                const eventId = interaction.options.getInteger("id");

                const result = await removeEvent(eventId, guildId);

                if (!result.success) {
                    return interaction.reply({
                        content: `❌ Event with ID **${eventId}** not found or you don't have permission to delete it.`,
                        ephemeral: true
                    });
                }

                return interaction.reply({
                    content: `✅ Event **"${result.deleted.name}"** has been removed!`,
                    ephemeral: false
                });
            }
        } catch (error) {
            console.error("Event command error:", error);
            return interaction.reply({
                content: "❌ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};
