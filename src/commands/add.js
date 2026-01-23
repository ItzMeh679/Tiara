const { SlashCommandBuilder } = require("discord.js");
const { lookupCity } = require("../utils/timezones");
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
        )
        .addStringOption((option) =>
            option
                .setName("city")
                .setDescription("City name (e.g., Mumbai, Tokyo, New York)")
                .setRequired(true)
        ),

    async execute(interaction) {
        const chartName = interaction.options.getString("chart");
        const cityName = interaction.options.getString("city");
        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        // Look up the city
        const cityInfo = lookupCity(cityName);
        if (!cityInfo) {
            return interaction.reply({
                content: `❌ City **"${cityName}"** not found!\n\nTry common cities like: Mumbai, Tokyo, New York, London, Sydney, Dubai, Singapore, Paris, etc.`,
                ephemeral: true,
            });
        }

        // Get or create the chart
        const chart = getOrCreateChart(chartName, guildId, userId);

        // Add the entry
        const result = addChartEntry(chart.id, cityInfo.label, cityInfo.zone, userId);

        if (result.success) {
            return interaction.reply({
                content: `✅ Added **${cityInfo.label}** to chart **"${chart.name}"**!`,
            });
        } else {
            return interaction.reply({
                content: `⚠️ ${result.error}`,
                ephemeral: true,
            });
        }
    },
};
