const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getDefaultTimeList, generateTimeList } = require("../utils/timezones");
const { getDefaultChartId, getChartEntries, db, getTimeFormat } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("time")
        .setDescription("Show the default world time chart"),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const timeFormat = guildId ? getTimeFormat(guildId) : '24h';

        // Check for custom default chart
        let title = "🕒 Current World Times";
        let timeList = getDefaultTimeList(timeFormat);
        let footer = "Use /setdefault to set a custom chart as default";

        if (guildId) {
            const defaultChartId = getDefaultChartId(guildId);
            if (defaultChartId) {
                const entries = getChartEntries(defaultChartId);
                if (entries && entries.length > 0) {
                    const chartInfo = db.prepare(
                        "SELECT name FROM charts WHERE id = ?"
                    ).get(defaultChartId);
                    if (chartInfo) {
                        title = `🕒 ${chartInfo.name}`;
                        timeList = generateTimeList(entries, timeFormat);
                        footer = "Use /setdefault to change • /chart <name> for others";
                    }
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(title)
            .setDescription(timeList)
            .setFooter({ text: footer })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
