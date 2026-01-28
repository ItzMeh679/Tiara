const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { lookupCity, convertTime, searchCities } = require("../utils/timezones");
const { getTimeFormat } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("convert")
        .setDescription("Convert a time from one timezone to another")
        .addStringOption(option =>
            option.setName("time")
                .setDescription("Time to convert (e.g., 3:00 PM or 15:00)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("from")
                .setDescription("Source city/timezone")
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName("to")
                .setDescription("Target city/timezone")
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            const cities = searchCities(focusedValue, 25);
            await interaction.respond(
                cities.map(city => ({
                    name: city.label,
                    value: city.name
                }))
            );
        } catch (error) {
            console.error("Autocomplete error:", error);
            await interaction.respond([]);
        }
    },

    async execute(interaction) {
        try {
            const timeStr = interaction.options.getString("time");
            const fromCity = interaction.options.getString("from");
            const toCity = interaction.options.getString("to");
            const guildId = interaction.guildId;
            const timeFormat = guildId ? await getTimeFormat(guildId) : '24h';

            const fromInfo = lookupCity(fromCity);
            const toInfo = lookupCity(toCity);

            if (!fromInfo) {
                return interaction.reply({
                    content: `❌ Source city **"${fromCity}"** not found!`,
                    ephemeral: true
                });
            }

            if (!toInfo) {
                return interaction.reply({
                    content: `❌ Target city **"${toCity}"** not found!`,
                    ephemeral: true
                });
            }

            const result = convertTime(timeStr, fromInfo.zone, toInfo.zone, timeFormat);

            if (!result) {
                return interaction.reply({
                    content: `❌ Invalid time format! Use formats like \`3:00 PM\` or \`15:00\``,
                    ephemeral: true
                });
            }

            const dayNote = !result.sameDay ? "\n⚠️ *Different day!*" : "";

            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle("🔄 Time Conversion")
                .setDescription(`Converting **${timeStr}** from ${fromInfo.label} to ${toInfo.label}`)
                .addFields(
                    {
                        name: `📍 ${fromInfo.label}`,
                        value: `\`${result.fromTime}\`\n${result.fromDate}`,
                        inline: true
                    },
                    {
                        name: "➡️",
                        value: "​",
                        inline: true
                    },
                    {
                        name: `${result.indicator} ${toInfo.label}`,
                        value: `\`${result.toTime}\`\n${result.toDate}${dayNote}`,
                        inline: true
                    }
                )
                .setFooter({ text: "Use /schedule to show a time in all chart zones" })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Convert command error:", error);
            return interaction.reply({
                content: "❌ An error occurred during conversion. Please try again.",
                ephemeral: true
            });
        }
    },
};
