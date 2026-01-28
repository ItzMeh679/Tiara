const { SlashCommandBuilder } = require("discord.js");
const { lookupCity, searchCities } = require("../utils/timezones");
const { getChart, removeChartEntry, getChartEntries, deleteChart, getAllCharts } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove a city/timezone from a chart")
        .addStringOption((option) =>
            option
                .setName("chart")
                .setDescription("Name of the chart")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption((option) =>
            option
                .setName("city")
                .setDescription("City name to remove")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);
            const guildId = interaction.guildId;

            if (focusedOption.name === "chart") {
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
            } else if (focusedOption.name === "city") {
                // Get current chart name to show only cities in that chart
                const chartName = interaction.options.getString("chart");
                if (chartName) {
                    const chart = await getChart(chartName, guildId);
                    if (chart) {
                        const entries = await getChartEntries(chart.id);
                        const filtered = entries
                            .filter(e => e.label.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
                                e.zone.toLowerCase().includes(focusedOption.value.toLowerCase()))
                            .slice(0, 25);
                        await interaction.respond(
                            filtered.map(entry => ({
                                name: entry.label,
                                value: entry.zone
                            }))
                        );
                        return;
                    }
                }
                // Fallback to general city search
                const cities = searchCities(focusedOption.value, 25);
                await interaction.respond(
                    cities.map(city => ({
                        name: city.label,
                        value: city.name
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
            const chartName = interaction.options.getString("chart");
            const cityName = interaction.options.getString("city");
            const guildId = interaction.guildId;

            // Get the chart
            const chart = await getChart(chartName, guildId);
            if (!chart) {
                return interaction.reply({
                    content: `❌ Chart **"${chartName}"** not found!`,
                    ephemeral: true,
                });
            }

            // Look up the city - first try as timezone, then as city name
            let timezone = cityName;
            let cityLabel = cityName;

            const cityInfo = lookupCity(cityName);
            if (cityInfo) {
                timezone = cityInfo.zone;
                cityLabel = cityInfo.label;
            }

            // Remove the entry
            const result = await removeChartEntry(chart.id, timezone);

            if (result.success) {
                // Check if chart is now empty, optionally delete it
                const remainingEntries = await getChartEntries(chart.id);

                let message = `✅ Removed **${cityLabel}** from chart **"${chart.name}"**`;

                if (remainingEntries.length === 0) {
                    await deleteChart(chart.id);
                    message += `\n\n📭 Chart **"${chart.name}"** is now empty and has been deleted.`;
                }

                return interaction.reply({ content: message });
            } else {
                return interaction.reply({
                    content: `⚠️ **${cityLabel}** was not found in chart **"${chart.name}"**`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error("Remove command error:", error);
            return interaction.reply({
                content: "❌ An error occurred while removing the city. Please try again.",
                ephemeral: true,
            });
        }
    },
};
