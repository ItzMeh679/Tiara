const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getAllCharts } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("charts")
        .setDescription("List all available time charts"),

    async execute(interaction) {
        const guildId = interaction.guildId;

        // Get all charts for this guild
        const charts = getAllCharts(guildId);

        if (charts.length === 0) {
            return interaction.reply({
                content: `📭 No charts yet!\n\nCreate one with \`/add <chart-name> <city>\`\nExample: \`/add "Friends Forever" Mumbai\``,
                ephemeral: true,
            });
        }

        // Format chart list
        const chartList = charts
            .map((c, i) => `**${i + 1}.** ${c.name} (${c.entry_count} ${c.entry_count === 1 ? 'city' : 'cities'})`)
            .join("\n");

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("📊 Available Time Charts")
            .setDescription(chartList)
            .setFooter({ text: "Use /chart <name> to view a chart" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
