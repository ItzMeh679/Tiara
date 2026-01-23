require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Validate environment variables
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN === "YOUR_BOT_TOKEN_HERE") {
    console.error("❌ Error: DISCORD_TOKEN not set in .env file!");
    process.exit(1);
}

if (!process.env.CLIENT_ID || process.env.CLIENT_ID === "YOUR_CLIENT_ID_HERE") {
    console.error("❌ Error: CLIENT_ID not set in .env file!");
    console.log("   Find it in Discord Developer Portal > Your App > General Information > Application ID");
    process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

// Load all commands
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
        console.log(`📦 Loaded command: /${command.data.name}`);
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`\n🔄 Registering ${commands.length} slash commands...`);

        // Register globally (takes up to 1 hour to propagate)
        // For instant testing, use guild-specific registration

        if (process.env.GUILD_ID && process.env.GUILD_ID !== "YOUR_GUILD_ID_HERE") {
            // Guild-specific (instant)
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${data.length} commands to guild!`);
        } else {
            // Global (takes time)
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log(`✅ Successfully registered ${data.length} global commands!`);
            console.log("⏳ Note: Global commands may take up to 1 hour to appear everywhere.");
        }

        console.log("\n📝 Available commands:");
        commands.forEach(cmd => {
            console.log(`   /${cmd.name} - ${cmd.description}`);
        });

    } catch (error) {
        console.error("❌ Error registering commands:", error);
    }
})();
