const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getTimeFormat, setTimeFormat } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timeformat")
        .setDescription("Set time display format for this server")
        .addStringOption(option =>
            option.setName("format")
                .setDescription("Time format to use")
                .setRequired(true)
                .addChoices(
                    { name: "12-hour (e.g., 2:30 PM)", value: "12h" },
                    { name: "24-hour (e.g., 14:30)", value: "24h" }
                )),

    async execute(interaction) {
        const guildId = interaction.guildId;

        if (!guildId) {
            return interaction.reply({
                content: "❌ This command can only be used in a server!",
                ephemeral: true
            });
        }

        const format = interaction.options.getString("format");
        const currentFormat = getTimeFormat(guildId);

        if (format === currentFormat) {
            return interaction.reply({
                content: `⏰ Time format is already set to **${format === "12h" ? "12-hour (AM/PM)" : "24-hour"}**!`,
                ephemeral: true
            });
        }

        setTimeFormat(guildId, format);

        const embed = new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle("⏰ Time Format Updated")
            .setDescription(format === "12h"
                ? "Times will now be displayed in **12-hour format** with AM/PM.\n\nExample: `2:30:45 PM`"
                : "Times will now be displayed in **24-hour format**.\n\nExample: `14:30:45`")
            .setFooter({ text: `Changed from ${currentFormat === "12h" ? "12-hour" : "24-hour"} format` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
