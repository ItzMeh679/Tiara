const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getDayNightIndicator } = require("../utils/timezones");
const { getAllUptime, getAllCharts, getChart, getChartEntries } = require("../utils/database");
const { DateTime } = require("luxon");

/**
 * Check if a user is awake at a given hour
 * Handles wrap-around (e.g., awake from 22 to 6)
 */
function isAwake(currentHour, awakeStart, awakeEnd) {
    if (awakeStart <= awakeEnd) {
        return currentHour >= awakeStart && currentHour < awakeEnd;
    } else {
        return currentHour >= awakeStart || currentHour < awakeEnd;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("whoisawake")
        .setDescription("See who's currently awake or sleeping")
        .addStringOption(option =>
            option.setName("chart")
                .setDescription("Filter by chart (optional)")
                .setRequired(false)
                .setAutocomplete(true)),

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
            const guild = interaction.guild;

            // Get all uptime entries
            const allUptime = await getAllUptime();

            if (allUptime.length === 0) {
                return interaction.reply({
                    content: "▪ No one has set their uptime yet!\n\nUse `/setuptime` to set your timezone and awake hours.",
                    ephemeral: true
                });
            }

            // Filter to members of this guild
            const guildMembers = await guild.members.fetch();
            const guildMemberIds = new Set(guildMembers.map(m => m.id));
            let relevantUptime = allUptime.filter(u => guildMemberIds.has(u.user_id));

            if (relevantUptime.length === 0) {
                return interaction.reply({
                    content: "▪ No server members have set their uptime yet!\n\nUse `/setuptime` to set your timezone and awake hours.",
                    ephemeral: true
                });
            }

            // If chart specified, show chart timezone zones too
            let chartInfo = null;
            let chartEntries = null;
            if (chartName && guildId) {
                const chart = await getChart(chartName, guildId);
                if (chart) {
                    chartInfo = chart;
                    chartEntries = await getChartEntries(chart.id);
                }
            }

            // Build the status list
            const awakeList = [];
            const sleepingList = [];

            for (const uptime of relevantUptime) {
                const now = DateTime.now().setZone(uptime.timezone);
                const currentHour = now.hour;
                const indicator = getDayNightIndicator(currentHour);
                const awake = isAwake(currentHour, uptime.awake_start, uptime.awake_end);

                // Get Discord display name
                const member = guildMembers.get(uptime.user_id);
                const displayName = member ? member.displayName : `User ${uptime.user_id.slice(-4)}`;

                const formatHour = (h) => {
                    if (h === 0) return "12 AM";
                    if (h === 12) return "12 PM";
                    if (h < 12) return `${h} AM`;
                    return `${h - 12} PM`;
                };

                const entry = `${indicator} **${displayName}** │ \`${now.toFormat("h:mm a")}\` · ${uptime.city_label}\n   ↳ Awake: ${formatHour(uptime.awake_start)} → ${formatHour(uptime.awake_end)}`;

                if (awake) {
                    awakeList.push(entry);
                } else {
                    sleepingList.push(entry);
                }
            }

            // Build embed
            const title = chartInfo ? `◷ Who's Awake — ${chartInfo.name}` : "◷ Who's Awake";
            let description = "";

            if (awakeList.length > 0) {
                description += `**● Awake** (${awakeList.length})\n\n${awakeList.join("\n\n")}\n\n`;
            }
            if (sleepingList.length > 0) {
                description += `───────────────\n\n**○ Sleeping** (${sleepingList.length})\n\n${sleepingList.join("\n\n")}`;
            }

            // If chart entries provided, show timezone status too
            if (chartEntries && chartEntries.length > 0) {
                description += "\n\n───────────────\n\n**▦ Chart Timezones**\n\n";
                for (const entry of chartEntries) {
                    const now = DateTime.now().setZone(entry.zone);
                    const indicator = getDayNightIndicator(now.hour);
                    const isWorkHours = now.hour >= 9 && now.hour < 17;
                    const status = isWorkHours ? "● Work hours" : now.hour >= 7 && now.hour < 22 ? "◐ Awake hours" : "○ Off hours";
                    description += `${indicator} ${entry.label} │ \`${now.toFormat("h:mm a")}\` · ${status}\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: `${awakeList.length} awake, ${sleepingList.length} sleeping │ /setuptime to set your hours` })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Whoisawake command error:", error);
            return interaction.reply({
                content: "✕ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};
