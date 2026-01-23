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
const { getChart, getChartEntries, getDefaultChartId, getTimeFormat } = require("./utils/database");

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

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
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
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
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
        // Check if mentioning with a chart name (e.g., "@TimeBot Friends Forever")
        if (botMentioned) {
            // Extract potential chart name from message (everything after the mention)
            const mentionPattern = new RegExp(`<@!?${client.user.id}>\\s*`, "g");
            const chartName = message.content.replace(mentionPattern, "").trim();

            if (chartName && message.guildId) {
                // Try to find the chart
                const chart = getChart(chartName, message.guildId);
                if (chart) {
                    const entries = getChartEntries(chart.id);
                    const timeFormat = getTimeFormat(message.guildId);
                    const embed = new EmbedBuilder()
                        .setColor(0x5865f2)
                        .setTitle(`🕒 ${chart.name}`)
                        .setDescription(generateTimeList(entries, timeFormat))
                        .setFooter({ text: "Times update in real-time" })
                        .setTimestamp();

                    return message.reply({ embeds: [embed] });
                }
            }
        }

        // Check for custom default chart
        const timeFormat = message.guildId ? getTimeFormat(message.guildId) : '24h';
        let title = "🕒 Current World Times";
        let timeList = getDefaultTimeList(timeFormat);
        let footer = "Use /chart <name> for custom charts • /add to create one";

        if (message.guildId) {
            const defaultChartId = getDefaultChartId(message.guildId);
            if (defaultChartId) {
                const entries = getChartEntries(defaultChartId);
                if (entries && entries.length > 0) {
                    // Get chart name for title
                    const chartInfo = require("./utils/database").db.prepare(
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

        await message.reply({ embeds: [embed] });
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
