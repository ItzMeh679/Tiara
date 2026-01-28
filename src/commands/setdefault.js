const { SlashCommandBuilder } = require("discord.js");
const { getChart, setDefaultChart, getAllCharts } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setdefault")
        .setDescription("Set a chart as the default for !time and @mentions")
        .addStringOption((option) =>
            option
                .setName("chart")
                .setDescription("Name of the chart to set as default (leave empty to reset)")
                .setRequired(false)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            const guildId = interaction.guildId;
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
            const chartName = interaction.options.getString("chart");
            const guildId = interaction.guildId;

            // If no chart name provided, reset to built-in default
            if (!chartName) {
                await setDefaultChart(guildId, null);
                return interaction.reply({
                    content: `✅ Reset to **built-in default** time chart!`,
                });
            }

            // Check if chart exists
            const chart = await getChart(chartName, guildId);
            if (!chart) {
                return interaction.reply({
                    content: `❌ Chart **"${chartName}"** not found!\n\nUse \`/charts\` to see available charts, or \`/add\` to create one first.`,
                    ephemeral: true,
                });
            }

            // Set as default
            await setDefaultChart(guildId, chart.id);

            return interaction.reply({
                content: `✅ **"${chart.name}"** is now the default chart!\n\nUsing \`!time\` or \`@TimeBot\` will now show this chart.`,
            });
        } catch (error) {
            console.error("Setdefault command error:", error);
            return interaction.reply({
                content: "❌ An error occurred while setting the default chart. Please try again.",
                ephemeral: true,
            });
        }
    },
};
