const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { supabase } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botstats")
        .setDescription("View TimeBot usage statistics"),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            // Get stats from Supabase
            const [chartsResult, entriesResult, settingsResult, usersResult] = await Promise.all([
                supabase.from("charts").select("id, guild_id", { count: "exact" }),
                supabase.from("chart_entries").select("id", { count: "exact" }),
                supabase.from("guild_settings").select("guild_id", { count: "exact" }),
                supabase.from("user_timezones").select("user_id", { count: "exact" })
            ]);

            const totalCharts = chartsResult.count || 0;
            const totalEntries = entriesResult.count || 0;
            const totalGuilds = settingsResult.count || 0;
            const totalUsers = usersResult.count || 0;

            // Get unique guilds from charts
            const uniqueGuilds = new Set((chartsResult.data || []).map(c => c.guild_id));

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle("◈ Bot Statistics")
                .setDescription("Usage statistics across all servers")
                .addFields(
                    { name: "Servers", value: `\`${uniqueGuilds.size || totalGuilds}\``, inline: true },
                    { name: "Charts", value: `\`${totalCharts}\``, inline: true },
                    { name: "Cities Added", value: `\`${totalEntries}\``, inline: true },
                    { name: "Users with TZ", value: `\`${totalUsers}\``, inline: true },
                    { name: "Avg Cities/Chart", value: `\`${totalCharts > 0 ? (totalEntries / totalCharts).toFixed(1) : 0}\``, inline: true },
                    { name: "Uptime", value: formatUptime(process.uptime()), inline: true }
                )
                .setFooter({ text: "TimeBot │ Helping teams across timezones" })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Botstats command error:", error);
            const reply = {
                content: "✕ An error occurred fetching statistics.",
                ephemeral: true
            };
            if (interaction.deferred) {
                return interaction.editReply(reply);
            }
            return interaction.reply(reply);
        }
    },
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.length > 0 ? parts.join(" ") : "< 1m";
}
