const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { lookupCity, getCountdown, searchCities, getDayNightIndicator } = require("../utils/timezones");
const { getTimeFormat } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("countdown")
        .setDescription("Show time remaining until a specific time")
        .addStringOption(option =>
            option.setName("time")
                .setDescription("Target time (e.g., 3:00 PM or 15:00)")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("zone")
                .setDescription("Timezone for the target time (city name)")
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName("event")
                .setDescription("Optional event name/description")
                .setRequired(false)),

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
            const zoneCity = interaction.options.getString("zone");
            const eventName = interaction.options.getString("event");

            const zoneInfo = lookupCity(zoneCity);
            if (!zoneInfo) {
                return interaction.reply({
                    content: `❌ City **"${zoneCity}"** not found!`,
                    ephemeral: true
                });
            }

            const countdown = getCountdown(timeStr, zoneInfo.zone);
            if (!countdown) {
                return interaction.reply({
                    content: `❌ Invalid time format! Use formats like \`3:00 PM\` or \`15:00\``,
                    ephemeral: true
                });
            }

            // Format countdown
            const parts = [];
            if (countdown.hours > 0) parts.push(`**${countdown.hours}** hour${countdown.hours !== 1 ? 's' : ''}`);
            if (countdown.minutes > 0) parts.push(`**${countdown.minutes}** minute${countdown.minutes !== 1 ? 's' : ''}`);
            if (parts.length === 0) parts.push(`**${countdown.seconds}** seconds`);

            const countdownStr = parts.join(", ");
            const title = eventName ? `⏱️ Countdown: ${eventName}` : "⏱️ Countdown";

            const embed = new EmbedBuilder()
                .setColor(0xfee75c)
                .setTitle(title)
                .setDescription(`Time remaining until **${countdown.targetTime}** in ${zoneInfo.label}`)
                .addFields(
                    { name: "⏰ Time Left", value: countdownStr, inline: true },
                    { name: "📅 Target", value: `${countdown.targetTime}\n${countdown.targetDate}`, inline: true },
                    { name: "📍 Location", value: zoneInfo.label, inline: true }
                )
                .setFooter({ text: "Countdown calculated at request time" })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Countdown command error:", error);
            return interaction.reply({
                content: "❌ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};
