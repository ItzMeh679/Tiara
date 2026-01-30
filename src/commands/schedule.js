const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { lookupCity, convertTime, searchCities, getDayNightIndicator } = require("../utils/timezones");
const { getTimeFormat, getChart, getChartEntries, getAllCharts } = require("../utils/database");
const { DateTime } = require("luxon");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Show a meeting time across all chart timezones")
        .addStringOption(option =>
            option.setName("time")
                .setDescription("Meeting time (e.g., 3:00 PM or 15:00)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("zone")
                .setDescription("Your timezone (city name)")
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName("chart")
                .setDescription("Chart to show times for (optional, uses default)")
                .setRequired(false)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName("message")
                .setDescription("Optional message/description for the meeting")
                .setRequired(false)),

    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);

            if (focusedOption.name === "zone") {
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
        try {
            const timeStr = interaction.options.getString("time");
            const zoneCity = interaction.options.getString("zone");
            const chartName = interaction.options.getString("chart");
            const message = interaction.options.getString("message");
            const guildId = interaction.guildId;
            const timeFormat = guildId ? await getTimeFormat(guildId) : '24h';

            const sourceInfo = lookupCity(zoneCity);
            if (!sourceInfo) {
                return interaction.reply({
                    content: `✕ City **"${zoneCity}"** not found!`,
                    ephemeral: true
                });
            }

            // Get chart entries
            let entries = [];
            let chartTitle = "Default Timezones";

            if (chartName) {
                const chart = await getChart(chartName, guildId);
                if (chart) {
                    entries = await getChartEntries(chart.id);
                    chartTitle = chart.name;
                }
            }

            if (entries.length === 0) {
                // Use default timezones
                const { DEFAULT_TIME_ZONES } = require("../utils/timezones");
                entries = DEFAULT_TIME_ZONES;
            }

            // Convert time for each entry
            const fields = [];
            for (const entry of entries) {
                const result = convertTime(timeStr, sourceInfo.zone, entry.zone, timeFormat);
                if (result) {
                    const dayNote = !result.sameDay ? " *(+1 day)*" : "";
                    fields.push({
                        name: `${result.indicator} ${entry.label}`,
                        value: `\`${result.toTime}\`${dayNote}\n${result.toDate}`,
                        inline: true
                    });
                }
            }

            const description = message
                ? `▪ **${message}**\n\n▸ ${timeStr} in ${sourceInfo.label}`
                : `▸ ${timeStr} in ${sourceInfo.label}`;

            const embed = new EmbedBuilder()
                .setColor(0x57f287)
                .setTitle(`🗓️ Schedule - ${chartTitle}`)
                .setDescription(description)
                .addFields(fields.slice(0, 25)) // Discord limit
                .setFooter({ text: "Times shown for each location" })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Schedule command error:", error);
            return interaction.reply({
                content: "✕ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};
