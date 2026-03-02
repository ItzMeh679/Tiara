const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { lookupCity, searchCities, getDayNightIndicator } = require("../utils/timezones");
const { setUserUptime, getUserUptime } = require("../utils/database");
const { DateTime } = require("luxon");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setuptime")
        .setDescription("Set your timezone and awake hours so others know when you're available")
        .addStringOption(option =>
            option.setName("city")
                .setDescription("Your city/timezone")
                .setRequired(true)
                .setAutocomplete(true))
        .addIntegerOption(option =>
            option.setName("awake_from")
                .setDescription("Hour you wake up (0-23, e.g. 7 for 7 AM, 15 for 3 PM)")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(23))
        .addIntegerOption(option =>
            option.setName("awake_until")
                .setDescription("Hour you sleep (0-23, e.g. 23 for 11 PM, 0 for midnight)")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(23)),

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
            const cityName = interaction.options.getString("city");
            const awakeFrom = interaction.options.getInteger("awake_from");
            const awakeUntil = interaction.options.getInteger("awake_until");
            const userId = interaction.user.id;

            const cityInfo = lookupCity(cityName);
            if (!cityInfo) {
                return interaction.reply({
                    content: `✕ City **"${cityName}"** not found!`,
                    ephemeral: true
                });
            }

            // Save to database
            await setUserUptime(userId, cityInfo.zone, cityInfo.label, awakeFrom, awakeUntil);

            // Format hours for display
            const formatHour = (h) => {
                if (h === 0) return "12:00 AM";
                if (h === 12) return "12:00 PM";
                if (h < 12) return `${h}:00 AM`;
                return `${h - 12}:00 PM`;
            };

            const now = DateTime.now().setZone(cityInfo.zone);
            const indicator = getDayNightIndicator(now.hour);
            const isCurrentlyAwake = isAwake(now.hour, awakeFrom, awakeUntil);

            const embed = new EmbedBuilder()
                .setColor(isCurrentlyAwake ? 0x57f287 : 0x95a5a6)
                .setTitle("✓ Uptime Set!")
                .setDescription(`Your availability has been configured.`)
                .addFields(
                    { name: "▪ Timezone", value: `${indicator} ${cityInfo.label}`, inline: true },
                    { name: "◷ Current Time", value: `\`${now.toFormat("h:mm a")}\``, inline: true },
                    { name: "○ Status", value: isCurrentlyAwake ? "● **Awake**" : "○ **Sleeping**", inline: true },
                    { name: "▸ Awake Hours", value: `${formatHour(awakeFrom)} → ${formatHour(awakeUntil)}`, inline: false }
                )
                .setFooter({ text: "Others can see your status with /whoisawake" })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Setuptime command error:", error);
            return interaction.reply({
                content: "✕ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};

/**
 * Check if a user is awake at a given hour
 * Handles wrap-around (e.g., awake from 22 to 6)
 */
function isAwake(currentHour, awakeStart, awakeEnd) {
    if (awakeStart <= awakeEnd) {
        // Normal range: e.g., 7 to 23
        return currentHour >= awakeStart && currentHour < awakeEnd;
    } else {
        // Wrap-around: e.g., 22 to 6 (night owl)
        return currentHour >= awakeStart || currentHour < awakeEnd;
    }
}
