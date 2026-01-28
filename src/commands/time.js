const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getDefaultTimeList, generateTimeList, generateInlineFields, DEFAULT_TIME_ZONES } = require("../utils/timezones");
const { getDefaultChartId, getChartEntries, getChartById, getTimeFormat } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("time")
        .setDescription("Show the default world time chart")
        .addStringOption(option =>
            option.setName("view")
                .setDescription("Display style")
                .setRequired(false)
                .addChoices(
                    { name: "Detailed (with dates)", value: "detailed" },
                    { name: "Compact (time only)", value: "compact" },
                    { name: "Grid (inline fields)", value: "grid" }
                )),

    async execute(interaction) {
        try {
            const guildId = interaction.guildId;
            const view = interaction.options.getString("view") || "detailed";
            const timeFormat = guildId ? await getTimeFormat(guildId) : '24h';

            // Check for custom default chart
            let title = "🕒 Current World Times";
            let entries = DEFAULT_TIME_ZONES;
            let footer = "Use /setdefault to set a custom chart as default";
            let chartId = null;

            if (guildId) {
                const defaultChartId = await getDefaultChartId(guildId);
                if (defaultChartId) {
                    const chartEntries = await getChartEntries(defaultChartId);
                    if (chartEntries && chartEntries.length > 0) {
                        const chartInfo = await getChartById(defaultChartId);
                        if (chartInfo) {
                            title = `🕒 ${chartInfo.name}`;
                            entries = chartEntries;
                            footer = "Use /setdefault to change • /chart <name> for others";
                            chartId = defaultChartId;
                        }
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setFooter({ text: footer })
                .setTimestamp();

            if (view === "grid") {
                embed.setTitle(title);
                embed.addFields(generateInlineFields(entries, timeFormat));
            } else {
                embed.setTitle(title);
                embed.setDescription(generateTimeList(entries, timeFormat, view));
            }

            // Create refresh button
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`refresh_time_${view}_${chartId || 'default'}`)
                        .setLabel("🔄 Refresh")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_compact_${chartId || 'default'}`)
                        .setLabel("📱 Compact")
                        .setStyle(view === 'compact' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_detailed_${chartId || 'default'}`)
                        .setLabel("📋 Detailed")
                        .setStyle(view === 'detailed' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`view_grid_${chartId || 'default'}`)
                        .setLabel("📊 Grid")
                        .setStyle(view === 'grid' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        } catch (error) {
            console.error("Time command error:", error);
            return interaction.reply({
                content: "❌ An error occurred while fetching time. Please try again.",
                ephemeral: true,
            });
        }
    },
};
