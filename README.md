# ⏰ TimeBot - Discord World Time Bot

A Discord bot that displays current times for different countries/cities with support for multiple custom charts.

## Features

- 🕒 **Default Time Chart** - Shows times for Mumbai, New York, London, Tokyo, Sydney
- 📊 **Custom Named Charts** - Create charts like "Friends Forever", "Work Team"
- ⚡ **Slash Commands** - Modern Discord slash command support
- 💬 **Message Commands** - Classic `!time` and @mention support
- 🗃️ **Persistent Storage** - Charts saved in SQLite database
- ⏱️ **Precise Time** - Exact time to seconds (HH:MM:SS)

## Quick Start

### 1. Get Your Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → Give it a name → Create
3. Go to **Bot** section → Click "Add Bot"
4. Under **TOKEN**, click "Reset Token" → Copy it
5. Enable **Message Content Intent** (scroll down in Bot settings)

### 2. Configure Environment

Edit `.env` file:
```env
DISCORD_TOKEN=your_actual_bot_token_here
CLIENT_ID=your_application_id_here    # Found in General Information
GUILD_ID=your_server_id_here          # Right-click server → Copy ID (optional)
```

### 3. Install & Run

```bash
npm install
npm run deploy   # Register slash commands
npm start        # Start the bot
```

### 4. Invite Bot to Server

The bot will print an invite URL when it starts. Or use:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```

## Commands

### Slash Commands
| Command | Description |
|---------|-------------|
| `/time` | Show the default world time chart |
| `/chart <name>` | Display a specific named chart |
| `/add <chart> <city>` | Add a city to a chart |
| `/remove <chart> <city>` | Remove a city from a chart |
| `/charts` | List all available charts |

### Message Commands
| Command | Description |
|---------|-------------|
| `!time` | Show the default world time chart |
| `@TimeBot` | Show the default time chart |
| `@TimeBot Friends Forever` | Show the "Friends Forever" chart |

## Examples

```
# Create a chart with cities
/add Friends Forever Mumbai
/add Friends Forever Tokyo
/add Friends Forever London

# View the chart
/chart Friends Forever

# Or just tag the bot with the chart name
@TimeBot Friends Forever
```

## Supported Cities (60+)

**India:** Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad

**USA:** New York, Los Angeles, Chicago, Houston, Seattle, San Francisco, Miami, Boston, Denver

**UK & Europe:** London, Manchester, Paris, Berlin, Amsterdam, Rome, Madrid, Moscow, Zurich, Vienna

**Asia:** Tokyo, Singapore, Hong Kong, Beijing, Shanghai, Seoul, Bangkok, Jakarta, Manila

**Middle East:** Dubai, Abu Dhabi, Riyadh, Doha, Tel Aviv, Istanbul

**Australia & Oceania:** Sydney, Melbourne, Brisbane, Perth, Auckland

**Americas:** Toronto, Vancouver, Montreal, Mexico City, São Paulo, Buenos Aires

**Africa:** Cairo, Johannesburg, Lagos, Nairobi

## Project Structure

```
TimeBot/
├── src/
│   ├── index.js              # Main bot entry point
│   ├── deploy-commands.js    # Slash command registration
│   ├── commands/
│   │   ├── add.js            # /add command
│   │   ├── chart.js          # /chart command
│   │   ├── charts.js         # /charts command
│   │   ├── remove.js         # /remove command
│   │   └── time.js           # /time command
│   └── utils/
│       ├── database.js       # SQLite database operations
│       └── timezones.js      # Timezone lookup & formatting
├── .env                      # Bot configuration
├── package.json
└── README.md
```

## Tech Stack

- **discord.js v14** - Discord API wrapper
- **luxon** - Timezone handling (IANA timezones)
- **better-sqlite3** - Persistent storage for charts
- **dotenv** - Environment configuration

## License

MIT
