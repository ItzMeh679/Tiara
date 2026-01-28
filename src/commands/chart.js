const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { generateTimeList, generateInlineFields } = require("../utils/timezones");
const { getChart, getChartEntries, getTimeFormat, getAllCharts } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("chart")
        .setDescription("Display times for a specific chart")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("Name of the chart to display")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName("view")
                .setDescription("Display style")
                .setRequired(false)
                .addChoices(
                    { name: "Detailed (with dates)", value: "detailed" },
                    { name: "Compact (time only)", value: "compact" },
                    { name: "Grid (inline fields)", value: "grid" }
                )),

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
            const chartName = interaction.options.getString("name");
            const view = interaction.options.getString("view") || "detailed";
            const guildId = interaction.guildId;
            const timeFormat = guildId ? await getTimeFormat(guildId) : '24h';

            // Get the chart
            const chart = await getChart(chartName, guildId);
            if (!chart) {
                return interaction.reply({
                    content: `❌ Chart **"${chartName}"** not found!\n\nUse \`/charts\` to see all available charts, or \`/add\` to create a new one.`,
                    ephemeral: true,
                });
            }

            // Get entries
            const entries = await getChartEntries(chart.id);

            // Create embed
            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setFooter({ text: "Times update in real-time • Use buttons to refresh" })
                .setTimestamp();

            if (view === "grid") {
                embed.setTitle(`🕒 ${chart.name}`);
                embed.addFields(generateInlineFields(entries, timeFormat));
            } else {
                embed.setTitle(`🕒 ${chart.name}`);
                embed.setDescription(generateTimeList(entries, timeFormat, view));
            }

            // Create interactive buttons
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`refresh_time_${view}_${chart.id}`)
                        .setLabel("🔄 Refresh")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_compact_${chart.id}`)
                        .setLabel("📱 Compact")
                        .setStyle(view === 'compact' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_detailed_${chart.id}`)
                        .setLabel("📋 Detailed")
                        .setStyle(view === 'detailed' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_grid_${chart.id}`)
                        .setLabel("📊 Grid")
                        .setStyle(view === 'grid' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error("Chart command error:", error);
            return interaction.reply({
                content: "❌ An error occurred while fetching the chart. Please try again.",
                ephemeral: true,
            });
        }
    },
};
