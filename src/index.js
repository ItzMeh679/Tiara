require("dotenv").config();
const {
    Client,
    GatewayIntentBits,
    Collection,
    Events,
    EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const http = require("http");

// ============================================
// HTTP Server for Render (keeps bot alive)
// ============================================
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            status: "ok",
            bot: "TimeBot",
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`🌐 Health server running on port ${PORT}`);
});

const { getDefaultTimeList, generateTimeList } = require("./utils/timezones");
const { getChart, getChartEntries, getDefaultChartId, getTimeFormat, getChartById } = require("./utils/database");

// Create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
    }
}

// Handle slash commands and autocomplete
client.on(Events.InteractionCreate, async (interaction) => {
    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
        const command = client.commands.get(interaction.commandName);
        if (!command || !command.autocomplete) return;

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.error(`Autocomplete error for ${interaction.commandName}:`, error);
            try {
                await interaction.respond([]);
            } catch (e) {
                // Ignore if already responded
            }
        }
        return;
    }

    // Handle button interactions
    if (interaction.isButton()) {
        try {
            const customId = interaction.customId;

            // Handle refresh and view change buttons
            if (customId.startsWith("refresh_time_") || customId.startsWith("view_")) {
                const { generateTimeList, generateInlineFields, DEFAULT_TIME_ZONES } = require("./utils/timezones");
                const { getChartEntries, getChartById, getTimeFormat } = require("./utils/database");
                const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

                let view = "detailed";
                let chartId = null;

                if (customId.startsWith("refresh_time_")) {
                    const parts = customId.replace("refresh_time_", "").split("_");
                    view = parts[0];
                    chartId = parts[1] === "default" ? null : parts[1];
                } else if (customId.startsWith("view_")) {
                    const parts = customId.replace("view_", "").split("_");
                    view = parts[0];
                    chartId = parts[1] === "default" ? null : parts[1];
                }

                const guildId = interaction.guildId;
                const timeFormat = guildId ? await getTimeFormat(guildId) : '24h';

                let title = "🕒 Current World Times";
                let entries = DEFAULT_TIME_ZONES;
                let footer = "Use /setdefault to set a custom chart as default";

                if (chartId) {
                    const chartEntries = await getChartEntries(parseInt(chartId));
                    if (chartEntries && chartEntries.length > 0) {
                        const chartInfo = await getChartById(parseInt(chartId));
                        if (chartInfo) {
                            title = `🕒 ${chartInfo.name}`;
                            entries = chartEntries;
                            footer = "Use /setdefault to change • /chart <name> for others";
                        }
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setFooter({ text: footer })
                    .setTimestamp();

                if (view === "grid") {
                    embed.setTitle(title);
                    embed.addFields(generateInlineFields(entries, timeFormat));
                } else {
                    embed.setTitle(title);
                    embed.setDescription(generateTimeList(entries, timeFormat, view));
                }

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`refresh_time_${view}_${chartId || 'default'}`)
                            .setLabel("🔄 Refresh")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`view_compact_${chartId || 'default'}`)
                            .setLabel("📱 Compact")
                            .setStyle(view === 'compact' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`view_detailed_${chartId || 'default'}`)
                            .setLabel("📋 Detailed")
                            .setStyle(view === 'detailed' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`view_grid_${chartId || 'default'}`)
                            .setLabel("📊 Grid")
                            .setStyle(view === 'grid' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    );

                await interaction.update({ embeds: [embed], components: [row] });
                return;
            }
        } catch (error) {
            console.error("Button interaction error:", error);
            try {
                await interaction.reply({ content: "❌ An error occurred.", ephemeral: true });
            } catch (e) {
                // Already responded
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        const reply = {
            content: "❌ There was an error executing this command!",
            ephemeral: true,
        };
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        } catch (e) {
            console.error("Error sending error reply:", e);
        }
    }
});

// Handle message-based commands (!time and @mentions)
client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    const botMentioned = message.mentions.has(client.user);
    const commandUsed = message.content.toLowerCase().startsWith("!time");

    if (botMentioned || commandUsed) {
        try {
            // Check if mentioning with a chart name (e.g., "@TimeBot Friends Forever")
            if (botMentioned) {
                // Extract potential chart name from message (everything after the mention)
                const mentionPattern = new RegExp(`<@!?${client.user.id}>\\s*`, "g");
                const chartName = message.content.replace(mentionPattern, "").trim();

                if (chartName && message.guildId) {
                    // Try to find the chart
                    const chart = await getChart(chartName, message.guildId);
                    if (chart) {
                        const entries = await getChartEntries(chart.id);
                        const timeFormat = await getTimeFormat(message.guildId);
                        const embed = new EmbedBuilder()
                            .setColor(0x5865f2)
                            .setTitle(`🕒 ${chart.name}`)
                            .setDescription(generateTimeList(entries, timeFormat, 'detailed'))
                            .setFooter({ text: "Use /time for interactive controls" })
                            .setTimestamp();

                        return message.reply({ embeds: [embed] });
                    }
                }
            }

            // Check for custom default chart
            const timeFormat = message.guildId ? await getTimeFormat(message.guildId) : '24h';
            let title = "🕒 Current World Times";
            let timeList = getDefaultTimeList(timeFormat, 'detailed');
            let footer = "Use /time for interactive controls • /add to create charts";

            if (message.guildId) {
                const defaultChartId = await getDefaultChartId(message.guildId);
                if (defaultChartId) {
                    const entries = await getChartEntries(defaultChartId);
                    if (entries && entries.length > 0) {
                        // Get chart name for title
                        const chartInfo = await getChartById(defaultChartId);
                        if (chartInfo) {
                            title = `🕒 ${chartInfo.name}`;
                            timeList = generateTimeList(entries, timeFormat, 'detailed');
                            footer = "Use /time for interactive controls";
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

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error handling message command:", error);
            await message.reply("❌ An error occurred while processing your request.");
        }
    }
});

// Bot ready
client.once(Events.ClientReady, (c) => {
    console.log(`\n✅ Logged in as ${c.user.tag}`);
    console.log(`📊 Loaded ${client.commands.size} commands`);
    console.log(`\n🔗 Invite URL:`);
    console.log(`https://discord.com/api/oauth2/authorize?client_id=${c.user.id}&permissions=2147485696&scope=bot%20applications.commands\n`);
});

// Login
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === "YOUR_BOT_TOKEN_HERE") {
    console.error("❌ Error: DISCORD_TOKEN not set in .env file!");
    console.log("\n📝 Setup Instructions:");
    console.log("1. Go to https://discord.com/developers/applications");
    console.log("2. Create a new application");
    console.log("3. Go to 'Bot' section and create a bot");
    console.log("4. Copy the token and paste it in .env file");
    console.log("5. Enable 'Message Content Intent' in Bot settings");
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
