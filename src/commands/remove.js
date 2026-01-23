const { SlashCommandBuilder } = require("discord.js");
const { lookupCity } = require("../utils/timezones");
const { getChart, removeChartEntry, getChartEntries, deleteChart } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove a city/timezone from a chart")
        .addStringOption((option) =>
            option
                .setName("chart")
                .setDescription("Name of the chart")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("city")
                .setDescription("City name to remove")
                .setRequired(true)
        ),

    async execute(interaction) {
        const chartName = interaction.options.getString("chart");
        const cityName = interaction.options.getString("city");
        const guildId = interaction.guildId;

        // Get the chart
        const chart = getChart(chartName, guildId);
        if (!chart) {
            return interaction.reply({
                content: `❌ Chart **"${chartName}"** not found!`,
                ephemeral: true,
            });
        }

        // Look up the city
        const cityInfo = lookupCity(cityName);
        if (!cityInfo) {
            return interaction.reply({
                content: `❌ City **"${cityName}"** not recognized!`,
                ephemeral: true,
            });
        }

        // Remove the entry
        const result = removeChartEntry(chart.id, cityInfo.zone);

        if (result.success) {
            // Check if chart is now empty, optionally delete it
            const remainingEntries = getChartEntries(chart.id);

            let message = `✅ Removed **${cityInfo.label}** from chart **"${chart.name}"**`;

            if (remainingEntries.length === 0) {
                deleteChart(chart.id);
                message += `\n\n📭 Chart **"${chart.name}"** is now empty and has been deleted.`;
            }

            return interaction.reply({ content: message });
        } else {
            return interaction.reply({
                content: `⚠️ **${cityInfo.label}** was not found in chart **"${chart.name}"**`,
                ephemeral: true,
            });
        }
    },
};
