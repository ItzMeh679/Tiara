const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { generateTimeList } = require("../utils/timezones");
const { getChart, getChartEntries, getTimeFormat } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chart")
        .setDescription("Display times for a specific chart")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("Name of the chart to display")
                .setRequired(true)
        ),

    async execute(interaction) {
        const chartName = interaction.options.getString("name");
        const guildId = interaction.guildId;
        const timeFormat = guildId ? getTimeFormat(guildId) : '24h';

        // Get the chart
        const chart = getChart(chartName, guildId);
        if (!chart) {
            return interaction.reply({
                content: `❌ Chart **"${chartName}"** not found!\n\nUse \`/charts\` to see all available charts, or \`/add\` to create a new one.`,
                ephemeral: true,
            });
        }

        // Get entries
        const entries = getChartEntries(chart.id);

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(0x5865f2) // Discord blurple
            .setTitle(`🕒 ${chart.name}`)
            .setDescription(generateTimeList(entries, timeFormat))
            .setFooter({ text: "Times update in real-time" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
