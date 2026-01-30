const { SlashCommandBuilder } = require("discord.js");
const { lookupCity } = require("../utils/timezones");
const { getOrCreateChart, addChartEntry } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("quickadd")
        .setDescription("Quickly add multiple cities to a chart at once")
        .addStringOption(option =>
            option.setName("chart")
                .setDescription("Chart name")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("cities")
                .setDescription("Comma-separated city names (e.g., Tokyo, Mumbai, London, NYC)")
                .setRequired(true)),

    async execute(interaction) {
        try {
            const chartName = interaction.options.getString("chart");
            const citiesStr = interaction.options.getString("cities");
            const guildId = interaction.guildId;
            const userId = interaction.user.id;

            // Parse cities
            const cityNames = citiesStr.split(",").map(c => c.trim()).filter(c => c.length > 0);

            if (cityNames.length === 0) {
                return interaction.reply({
                    content: "✕ Please provide at least one city!",
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // Get or create chart
            const chart = await getOrCreateChart(chartName, guildId, userId);

            const results = {
                added: [],
                notFound: [],
                duplicate: []
            };

            // Add each city
            for (const cityName of cityNames) {
                const cityInfo = lookupCity(cityName);

                if (!cityInfo) {
                    results.notFound.push(cityName);
                    continue;
                }

                const result = await addChartEntry(chart.id, cityInfo.label, cityInfo.zone, userId);

                if (result.success) {
                    results.added.push(cityInfo.label);
                } else {
                    results.duplicate.push(cityName);
                }
            }

            // Build response
            let response = `◈ **Chart: ${chart.name}**\n\n`;

            if (results.added.length > 0) {
                response += `✓ **Added (${results.added.length}):**\n${results.added.map(c => `　· ${c}`).join("\n")}\n\n`;
            }

            if (results.duplicate.length > 0) {
                response += `⚠️ **Already exists (${results.duplicate.length}):**\n${results.duplicate.map(c => `　· ${c}`).join("\n")}\n\n`;
            }

            if (results.notFound.length > 0) {
                response += `✕ **Not found (${results.notFound.length}):**\n${results.notFound.map(c => `　· ${c}`).join("\n")}`;
            }

            return interaction.editReply({ content: response });
        } catch (error) {
            console.error("Quickadd command error:", error);
            const reply = {
                content: "✕ An error occurred. Please try again.",
                ephemeral: true
            };
            if (interaction.deferred) {
                return interaction.editReply(reply);
            }
            return interaction.reply(reply);
        }
    },
};
