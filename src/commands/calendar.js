const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { DateTime } = require("luxon");
const { getEvents, getChart, getAllCharts, getTimeFormat, getChartEntries } = require("../utils/database");
const { formatEventForMultipleTimezones } = require("../utils/timezones");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("calendar")
        .setDescription("View the event calendar")
        .addStringOption(option =>
            option.setName("chart")
                .setDescription("Filter events by chart (optional)")
                .setRequired(false)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        try {
            const guildId = interaction.guildId;
            const focusedValue = interaction.options.getFocused();
            const charts = await getAllCharts(guildId);
            const filtered = charts
                .filter(c => c.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25);
            await interaction.respond(
                filtered.map(chart => ({
                    name: `${chart.name} (${chart.entry_count} cities)`,
                    value: chart.name
                }))
            );
        } catch (error) {
            console.error("Autocomplete error:", error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        try {
            const guildId = interaction.guildId;
            const chartName = interaction.options.getString("chart");
            const timeFormat = await getTimeFormat(guildId);

            let chartId = null;
            let chartEntries = null;
            let title = "▪ Event Calendar";

            if (chartName) {
                const chart = await getChart(chartName, guildId);
                if (chart) {
                    chartId = chart.id;
                    title = `▪ Calendar ─ ${chart.name}`;
                    chartEntries = await getChartEntries(chart.id);
                }
            }

            const events = await getEvents(guildId, chartId);

            if (events.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(title)
                    .setDescription("▫ No upcoming events scheduled.\n\nUse `/event add` to create your first event!")
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            // Group events by date
            const groupedEvents = {};
            const now = DateTime.now();

            for (const event of events) {
                const eventTime = DateTime.fromISO(event.event_time).setZone(event.timezone);
                const dateKey = eventTime.toFormat("yyyy-MM-dd");

                if (!groupedEvents[dateKey]) {
                    groupedEvents[dateKey] = {
                        date: eventTime,
                        events: []
                    };
                }
                groupedEvents[dateKey].events.push({
                    ...event,
                    parsedTime: eventTime
                });
            }

            // Build calendar display
            let description = "";
            const sortedDates = Object.keys(groupedEvents).sort();

            for (const dateKey of sortedDates.slice(0, 7)) { // Show next 7 days with events
                const group = groupedEvents[dateKey];
                const dateLabel = group.date.toFormat("EEEE, MMMM d");
                const isToday = group.date.hasSame(now, "day");
                const isTomorrow = group.date.hasSame(now.plus({ days: 1 }), "day");

                let dayLabel = dateLabel;
                if (isToday) dayLabel = `● TODAY ─ ${dateLabel}`;
                else if (isTomorrow) dayLabel = `○ Tomorrow ─ ${dateLabel}`;

                description += `### ${dayLabel}\n`;

                for (const event of group.events) {
                    const chartTag = event.charts?.name ? `◈ ${event.charts.name}` : "";

                    // Check if event is linked to a chart with entries (either the filtered chart or the event's own chart)
                    let eventChartEntries = chartEntries;
                    if (!eventChartEntries && event.chart_id) {
                        // Fetch entries for this specific event's chart
                        eventChartEntries = await getChartEntries(event.chart_id);
                    }

                    if (eventChartEntries && eventChartEntries.length > 0) {
                        // Show multi-timezone display
                        const multiTz = formatEventForMultipleTimezones(
                            event.event_time,
                            event.timezone,
                            eventChartEntries.map(e => ({ label: e.label, zone: e.zone })),
                            timeFormat
                        );
                        description += `> ▸ **${event.name}** ${chartTag}\n`;
                        multiTz.split('\n').forEach(line => {
                            description += `>${line}\n`;
                        });
                    } else {
                        // Single timezone display
                        const timeStr = timeFormat === '12h'
                            ? event.parsedTime.toFormat("h:mm a")
                            : event.parsedTime.toFormat("HH:mm");
                        description += `> ▸ **${event.name}** │ \`${timeStr}\` ${chartTag}\n`;
                    }

                    if (event.description) {
                        description += `> _${event.description}_\n`;
                    }
                }
                description += "\n";
            }

            // Show remaining count if any
            const remainingDays = sortedDates.length - 7;
            if (remainingDays > 0) {
                const remainingEvents = sortedDates.slice(7).reduce((acc, key) =>
                    acc + groupedEvents[key].events.length, 0);
                description += `_+ ${remainingEvents} more events in ${remainingDays} more days_`;
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: `${events.length} upcoming events · Use /event add to create more` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Calendar command error:", error);
            return interaction.reply({
                content: "✕ An error occurred while loading the calendar.",
                ephemeral: true
            });
        }
    },
};
