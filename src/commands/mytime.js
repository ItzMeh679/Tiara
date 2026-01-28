const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { lookupCity, searchCities, getDayNightIndicator } = require("../utils/timezones");
const { DateTime } = require("luxon");

// Import database functions for user timezone storage
const { supabase } = require("../utils/database");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mytime")
        .setDescription("Set or view your personal timezone")
        .addSubcommand(subcommand =>
            subcommand.setName("set")
                .setDescription("Set your personal timezone")
                .addStringOption(option =>
                    option.setName("city")
                        .setDescription("Your city/timezone")
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand.setName("view")
                .setDescription("View your current time")),

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
            const subcommand = interaction.options.getSubcommand();
            const userId = interaction.user.id;

            if (subcommand === "set") {
                const cityName = interaction.options.getString("city");
                const cityInfo = lookupCity(cityName);

                if (!cityInfo) {
                    return interaction.reply({
                        content: `❌ City **"${cityName}"** not found!`,
                        ephemeral: true
                    });
                }

                // Save to database
                const { error } = await supabase
                    .from("user_timezones")
                    .upsert({
                        user_id: userId,
                        timezone: cityInfo.zone,
                        city_label: cityInfo.label
                    }, { onConflict: "user_id" });

                if (error) throw error;

                const now = DateTime.now().setZone(cityInfo.zone);
                const indicator = getDayNightIndicator(now.hour);

                const embed = new EmbedBuilder()
                    .setColor(0x57f287)
                    .setTitle("✅ Timezone Set!")
                    .setDescription(`Your timezone is now set to:\n${indicator} **${cityInfo.label}**`)
                    .addFields(
                        { name: "Current Time", value: `\`${now.toFormat("h:mm:ss a")}\``, inline: true },
                        { name: "Date", value: now.toFormat("cccc, LLLL d, yyyy"), inline: true }
                    )
                    .setFooter({ text: "Use /mytime view to check your time anytime" })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });

            } else if (subcommand === "view") {
                // Get from database
                const { data, error } = await supabase
                    .from("user_timezones")
                    .select("timezone, city_label")
                    .eq("user_id", userId)
                    .single();

                if (error && error.code !== "PGRST116") throw error;

                if (!data) {
                    return interaction.reply({
                        content: "❌ You haven't set your timezone yet!\n\nUse `/mytime set <city>` to set it.",
                        ephemeral: true
                    });
                }

                const now = DateTime.now().setZone(data.timezone);
                const indicator = getDayNightIndicator(now.hour);

                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(`${indicator} Your Current Time`)
                    .setDescription(`**${data.city_label}**`)
                    .addFields(
                        { name: "🕐 Time", value: `\`${now.toFormat("h:mm:ss a")}\``, inline: true },
                        { name: "📅 Date", value: now.toFormat("cccc, LLLL d"), inline: true },
                        { name: "🌐 UTC Offset", value: now.toFormat("ZZZZ"), inline: true }
                    )
                    .setFooter({ text: "Use /mytime set to change your timezone" })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Mytime command error:", error);
            return interaction.reply({
                content: "❌ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};
