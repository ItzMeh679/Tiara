const { SlashCommandBuilder } = require("discord.js");
const { getChart, setDefaultChart } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setdefault")
        .setDescription("Set a chart as the default for !time and @mentions")
        .addStringOption((option) =>
            option
                .setName("chart")
                .setDescription("Name of the chart to set as default (leave empty to reset)")
                .setRequired(false)
        ),

    async execute(interaction) {
        const chartName = interaction.options.getString("chart");
        const guildId = interaction.guildId;

        // If no chart name provided, reset to built-in default
        if (!chartName) {
            setDefaultChart(guildId, null);
            return interaction.reply({
                content: `✅ Reset to **built-in default** time chart!`,
            });
        }

        // Check if chart exists
        const chart = getChart(chartName, guildId);
        if (!chart) {
            return interaction.reply({
                content: `❌ Chart **"${chartName}"** not found!\n\nUse \`/charts\` to see available charts, or \`/add\` to create one first.`,
                ephemeral: true,
            });
        }

        // Set as default
        setDefaultChart(guildId, chart.id);

        return interaction.reply({
            content: `✅ **"${chart.name}"** is now the default chart!\n\nUsing \`!time\` or \`@TimeBot\` will now show this chart.`,
        });
    },
};
