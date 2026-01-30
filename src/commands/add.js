const { SlashCommandBuilder } = require("discord.js");
const { lookupCity, searchCities } = require("../utils/timezones");
const { getOrCreateChart, addChartEntry } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add")
        .setDescription("Add a city/timezone to a chart")
        .addStringOption((option) =>
            option
                .setName("chart")
                .setDescription("Name of the chart (e.g., Friends Forever)")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption((option) =>
            option
                .setName("city")
                .setDescription("City name (e.g., Mumbai, Tokyo, New York)")
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        try {
            const focusedOption = interaction.options.getFocused(true);

            if (focusedOption.name === "city") {
                // City autocomplete
                const cities = searchCities(focusedOption.value, 25);
                await interaction.respond(
                    cities.map(city => ({
                        name: city.label,
                        value: city.name
                    }))
                );
            } else if (focusedOption.name === "chart") {
                // Chart autocomplete - fetch from database
                const { getAllCharts } = require("../utils/database");
                const guildId = interaction.guildId;
                const charts = await getAllCharts(guildId);
                const filtered = charts
                    .filter(c => c.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
                    .slice(0, 25);
                await interaction.respond(
                    filtered.map(chart => ({
                        name: chart.name,
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
            const chartName = interaction.options.getString("chart");
            const cityName = interaction.options.getString("city");
            const guildId = interaction.guildId;
            const userId = interaction.user.id;

            // Look up the city
            const cityInfo = lookupCity(cityName);
            if (!cityInfo) {
                return interaction.reply({
                    content: `✕ City **"${cityName}"** not found!\n\nTry common cities like: Mumbai, Tokyo, New York, London, Sydney, Dubai, Singapore, Paris, etc.`,
                    ephemeral: true,
                });
            }

            // Get or create the chart
            const chart = await getOrCreateChart(chartName, guildId, userId);

            // Add the entry
            const result = await addChartEntry(chart.id, cityInfo.label, cityInfo.zone, userId);

            if (result.success) {
                return interaction.reply({
                    content: `✓ Added **${cityInfo.label}** to chart **"${chart.name}"**!`,
                });
            } else {
                return interaction.reply({
                    content: `⚠️ ${result.error}`,
                    ephemeral: true,
                });
            }
        } catch (error) {
            console.error("Add command error:", error);
            return interaction.reply({
                content: "✕ An error occurred while adding the city. Please try again.",
                ephemeral: true,
            });
        }
    },
};
