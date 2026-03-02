const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { lookupCity, searchCities } = require("../utils/timezones");
const { addReminder, getUserReminders, cancelReminder } = require("../utils/database");
const { DateTime } = require("luxon");

/**
 * Parse a date/time string with optional date
 * Supports: "3:00 PM", "15:00", "tomorrow 3pm", "Jan 31 3:00 PM", "in 30 minutes"
 */
function parseDateTime(input, timezone) {
    const now = DateTime.now().setZone(timezone);
    const lowerInput = input.toLowerCase().trim();

    // Handle relative durations: "in 30 minutes", "in 2 hours", "in 1 hour 30 min"
    const relativeMatch = lowerInput.match(/^in\s+(?:(\d+)\s*h(?:ours?)?)?[\s,]*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/i);
    if (relativeMatch) {
        const hours = parseInt(relativeMatch[1]) || 0;
        const minutes = parseInt(relativeMatch[2]) || 0;
        if (hours > 0 || minutes > 0) {
            return now.plus({ hours, minutes });
        }
    }

    // Simple relative: "in 30m", "in 2h"
    const shortRelative = lowerInput.match(/^in\s+(\d+)\s*(m|h)$/i);
    if (shortRelative) {
        const val = parseInt(shortRelative[1]);
        const unit = shortRelative[2].toLowerCase() === 'h' ? 'hours' : 'minutes';
        return now.plus({ [unit]: val });
    }

    // Handle "tomorrow/today" prefix
    let dateOffset = 0;
    let timeStr = input;

    if (lowerInput.startsWith("tomorrow")) {
        dateOffset = 1;
        timeStr = input.slice(8).trim();
    } else if (lowerInput.startsWith("today")) {
        dateOffset = 0;
        timeStr = input.slice(5).trim();
    }

    // Try full date-time formats
    const fullFormats = [
        "yyyy-MM-dd HH:mm", "yyyy-MM-dd h:mm a",
        "MMM d HH:mm", "MMM d h:mm a",
        "MMM d, yyyy HH:mm", "MMM d, yyyy h:mm a",
        "MMMM d HH:mm", "MMMM d h:mm a",
        "d MMM HH:mm", "d MMM h:mm a",
    ];

    for (const fmt of fullFormats) {
        const parsed = DateTime.fromFormat(input, fmt, { zone: timezone });
        if (parsed.isValid) {
            let result = parsed;
            if (!input.includes(now.year.toString())) {
                result = parsed.set({ year: now.year });
                if (result < now) result = parsed.set({ year: now.year + 1 });
            }
            return result;
        }
    }

    // Try time-only formats
    const timeFormats = ["HH:mm", "H:mm", "h:mm a", "ha", "h a", "HH"];
    for (const fmt of timeFormats) {
        const parsed = DateTime.fromFormat(timeStr.trim(), fmt, { zone: timezone });
        if (parsed.isValid) {
            let result = now.set({
                hour: parsed.hour, minute: parsed.minute,
                second: 0, millisecond: 0
            }).plus({ days: dateOffset });

            if (dateOffset === 0 && result < now) {
                result = result.plus({ days: 1 });
            }
            return result;
        }
    }

    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remind")
        .setDescription("Set timezone-aware reminders")
        .addSubcommand(subcommand =>
            subcommand.setName("set")
                .setDescription("Set a new reminder")
                .addStringOption(option =>
                    option.setName("time")
                        .setDescription("When to remind (e.g., '3:00 PM', 'in 30m', 'tomorrow 9am')")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("zone")
                        .setDescription("Timezone for the time")
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName("message")
                        .setDescription("What to remind you about")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName("list")
                .setDescription("View your pending reminders"))
        .addSubcommand(subcommand =>
            subcommand.setName("cancel")
                .setDescription("Cancel a reminder")
                .addIntegerOption(option =>
                    option.setName("id")
                        .setDescription("Reminder ID to cancel")
                        .setRequired(true))),

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
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        try {
            if (subcommand === "set") {
                const timeStr = interaction.options.getString("time");
                const zoneCity = interaction.options.getString("zone");
                const message = interaction.options.getString("message");

                const zoneInfo = lookupCity(zoneCity);
                if (!zoneInfo) {
                    return interaction.reply({
                        content: `✕ City **"${zoneCity}"** not found!`,
                        ephemeral: true
                    });
                }

                const remindAt = parseDateTime(timeStr, zoneInfo.zone);
                if (!remindAt) {
                    return interaction.reply({
                        content: `✕ Could not parse time: **"${timeStr}"**\n\nExamples:\n· \`3:00 PM\` · \`15:00\` · \`in 30m\` · \`in 2h\`\n· \`tomorrow 9am\` · \`Jan 31 3:00 PM\``,
                        ephemeral: true
                    });
                }

                // Save reminder
                const reminder = await addReminder(
                    userId,
                    interaction.guildId,
                    interaction.channelId,
                    message,
                    remindAt.toJSDate(),
                    zoneInfo.zone
                );

                // Calculate countdown
                const diff = remindAt.diff(DateTime.now(), ['hours', 'minutes']);
                const hours = Math.floor(diff.hours);
                const minutes = Math.floor(diff.minutes);
                let countdownStr = "";
                if (hours > 0) countdownStr += `**${hours}** hour${hours !== 1 ? 's' : ''} `;
                if (minutes > 0) countdownStr += `**${minutes}** minute${minutes !== 1 ? 's' : ''}`;
                if (!countdownStr) countdownStr = "**less than a minute**";

                const embed = new EmbedBuilder()
                    .setColor(0x57f287)
                    .setTitle("⏰ Reminder Set!")
                    .setDescription(`I'll DM you when it's time.`)
                    .addFields(
                        { name: "▸ Message", value: message, inline: false },
                        { name: "◷ When", value: remindAt.toFormat("EEE, MMM d 'at' h:mm a"), inline: true },
                        { name: "▪ Timezone", value: zoneInfo.label, inline: true },
                        { name: "○ In", value: countdownStr.trim(), inline: true }
                    )
                    .setFooter({ text: `ID: ${reminder.id} │ /remind list to see all │ /remind cancel to remove` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });

            } else if (subcommand === "list") {
                const reminders = await getUserReminders(userId);

                if (reminders.length === 0) {
                    return interaction.reply({
                        content: "▪ You have no pending reminders.\n\nUse `/remind set` to create one!",
                        ephemeral: true
                    });
                }

                const list = reminders.slice(0, 10).map(r => {
                    const time = DateTime.fromISO(r.remind_at).setZone(r.timezone);
                    const now = DateTime.now();
                    const diff = time.diff(now, ['hours', 'minutes']);
                    const hours = Math.floor(diff.hours);
                    const minutes = Math.floor(diff.minutes);
                    let countdown = "";
                    if (hours > 0) countdown += `${hours}h `;
                    if (minutes > 0) countdown += `${minutes}m`;
                    if (!countdown) countdown = "<1m";

                    return `**${r.reminder_text}** (ID: ${r.id})\n▪ ${time.toFormat("EEE, MMM d 'at' h:mm a")} · in ${countdown.trim()}`;
                }).join("\n\n");

                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle("⏰ Your Reminders")
                    .setDescription(list)
                    .setFooter({ text: `${reminders.length} pending │ /remind cancel <id> to remove` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === "cancel") {
                const reminderId = interaction.options.getInteger("id");
                const result = await cancelReminder(reminderId, userId);

                if (!result.success) {
                    return interaction.reply({
                        content: `✕ Reminder **#${reminderId}** not found or doesn't belong to you.`,
                        ephemeral: true
                    });
                }

                return interaction.reply({
                    content: `✓ Reminder **"${result.deleted.reminder_text}"** cancelled!`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error("Remind command error:", error);
            return interaction.reply({
                content: "✕ An error occurred. Please try again.",
                ephemeral: true
            });
        }
    },
};
