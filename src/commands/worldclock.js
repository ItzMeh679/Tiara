const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { generateTimeList, generateInlineFields, DEFAULT_TIME_ZONES } = require("../utils/timezones");
const { addWorldclock, removeWorldclock, getChartEntries, getChart, getAllCharts, getChartById, getTimeFormat } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("worldclock")
        .setDescription("Manage a live-updating world clock in this channel")
        .addSubcommand(subcommand =>
            subcommand.setName("start")
                .setDescription("Start a live clock that updates every 60 seconds")
                .addStringOption(option =>
                    option.setName("chart")
                        .setDescription("Chart to display (optional, uses default)")
                        .setRequired(false)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand.setName("stop")
                .setDescription("Stop the live clock in this channel"))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

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
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const channelId = interaction.channelId;

        try {
            if (subcommand === "start") {
                const chartName = interaction.options.getString("chart");
                const timeFormat = guildId ? await getTimeFormat(guildId) : '24h';

                let title = "◷ World Clock ─ Live";
                let entries = DEFAULT_TIME_ZONES;
                let chartId = null;

                if (chartName) {
                    const chart = await getChart(chartName, guildId);
                    if (chart) {
                        const chartEntries = await getChartEntries(chart.id);
                        if (chartEntries && chartEntries.length > 0) {
                            title = `◷ ${chart.name} ─ Live`;
                            entries = chartEntries;
                            chartId = chart.id;
                        }
                    }
                }

                // Build the embed
                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(title)
                    .setDescription(generateTimeList(entries, timeFormat, "detailed"))
                    .setFooter({ text: "◷ Auto-updates every 60 seconds │ /worldclock stop to disable" })
                    .setTimestamp();

                // Send the message
                const message = await interaction.reply({ embeds: [embed], fetchReply: true });

                // Save to database for interval updates
                await addWorldclock(guildId, channelId, message.id, chartId, interaction.user.id);

                // Send ephemeral confirmation
                await interaction.followUp({
                    content: "✓ Live world clock started! It will auto-update every 60 seconds.\n▪ Use `/worldclock stop` to disable.",
                    ephemeral: true
                });

            } else if (subcommand === "stop") {
                const result = await removeWorldclock(guildId, channelId);

                if (!result.success) {
                    return interaction.reply({
                        content: "✕ No active world clock found in this channel.",
                        ephemeral: true
                    });
                }

                // Try to delete the old message
                try {
                    const channel = await interaction.client.channels.fetch(channelId);
                    const oldMessage = await channel.messages.fetch(result.deleted.message_id);
                    await oldMessage.delete();
                } catch (e) {
                    // Message might already be deleted
                }

                return interaction.reply({
                    content: "✓ Live world clock stopped and removed.",
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error("Worldclock command error:", error);
            return interaction.reply({
                content: "✕ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};
