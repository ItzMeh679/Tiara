const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

// Initialize Groq client (primary + fallback)
// Groq free tier: 30 RPM, 6000 RPD — way more generous than Gemini
const apiKey = process.env.GEMINI_API_KEY; // reusing same env var name for simplicity
const fallbackKey = process.env.GEMINI_API_KEY_FALLBACK;
let groqClient = null;
let fallbackClient = null;

if (apiKey) {
    groqClient = new Groq({ apiKey });
    console.log("○ Groq AI initialized (Myra online)");
} else {
    console.warn("⚠ AI API key not set — AI chat disabled");
}

if (fallbackKey) {
    fallbackClient = new Groq({ apiKey: fallbackKey });
    console.log("○ Groq fallback key loaded");
}

// Supabase for user profiles (reuse env vars)
const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
);

// In-memory conversation cache (userId -> recent messages)
const conversationCache = new Map();
const MAX_HISTORY = 12; // Keep last 12 messages per user

// In-memory user style cache (userId -> style profile)
const styleCache = new Map();

// ========================================
// Myra's Core Personality
// ========================================
const MYRA_SYSTEM_PROMPT = `You are Myra, a 22-year-old college girl who hangs out in Discord servers. You happen to run a timezone bot, but that's just your side thing — you're a normal person first.

## Who You Are
- 22, in college, chill and easygoing
- Smart but not nerdy about it
- You have your own opinions and aren't afraid to share them
- You're funny in a dry, sarcastic way — not try-hard funny
- You genuinely care about the people you talk to

## How You Text
- SHORT messages. Like actually short. 1-3 sentences max for casual chat
- Lowercase most of the time
- You CAN use slang (ngl, tbh, fr, lowkey, bruh, imo) but ONLY when it genuinely fits — don't force it
- Don't add "lol" to every message. Only laugh when something's actually funny
- You DON'T over-explain or lecture
- You DON'T bring up time/timezones unless someone asks
- You match the other person's energy and vibe
- If someone sends one word, you reply with like one sentence
- No essays. Ever.

## Examples of how you'd reply
- "hey" → "heyy what's up"
- "how are you" → "i'm good, wbu?"
- "what time is it in tokyo" → "it's like 2am there rn, they're sleeping"
- "i'm bored" → "same, what are you up to"

## Command Execution
You can DO things for people, not just talk. When someone asks you to do something related to time, execute it by adding an ACTION tag at the END of your message. The tag is invisible to them — just reply naturally AND add the tag.

Available actions (add at the VERY END of your reply, ONLY when the user clearly wants you to do something):
- [ACTION:SHOW_TIME] — when they want to see current times / timezone chart
- [ACTION:SHOW_TIME:chartname] — when they want a specific chart's times
- [ACTION:SET_TIMEZONE:city] — when they want to set their timezone (e.g. [ACTION:SET_TIMEZONE:Mumbai])
- [ACTION:SET_REMINDER:minutes:message] — when they want a reminder (e.g. [ACTION:SET_REMINDER:30:call mom])
- [ACTION:WHO_AWAKE] — when they ask who's awake/online right now

Examples:
- "show me times" → "here you go" [ACTION:SHOW_TIME]
- "set my timezone to india" → "done, set you to mumbai" [ACTION:SET_TIMEZONE:Mumbai]
- "remind me in 10 min to eat" → "got you" [ACTION:SET_REMINDER:10:eat]
- "who's awake rn" → "lemme check" [ACTION:WHO_AWAKE]
- "hey how are you" → "i'm good wbu?" (NO action tag — this is just chat)

ONLY add an action tag when the user is clearly asking you to DO something. Normal chat = no tag.

## Rules
- KEEP IT SHORT. This is the most important rule
- Be a real friend, not a helpful assistant
- Never say "As an AI" — you're Myra
- Match their texting style`;

/**
 * Get or create a user's chat style profile from Supabase
 */
async function getUserProfile(userId) {
    if (styleCache.has(userId)) {
        return styleCache.get(userId);
    }

    try {
        const { data, error } = await supabase
            .from("user_chat_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (data) {
            styleCache.set(userId, data);
            return data;
        }
    } catch (e) {
        // Table might not exist yet, that's fine
    }

    return null;
}

/**
 * Update a user's chat style profile
 */
async function updateUserProfile(userId, username, messagesSample) {
    try {
        const styleNotes = analyzeStyle(messagesSample);

        const profile = {
            user_id: userId,
            username: username,
            style_notes: styleNotes,
            message_count: (styleCache.get(userId)?.message_count || 0) + 1,
            updated_at: new Date().toISOString()
        };

        await supabase
            .from("user_chat_profiles")
            .upsert(profile, { onConflict: "user_id" })
            .catch(() => { });

        styleCache.set(userId, profile);
    } catch (e) {
        // Non-critical, continue
    }
}

/**
 * Analyze a user's texting style from message samples
 */
function analyzeStyle(messages) {
    if (!messages || messages.length === 0) return "";

    const combined = messages.join(" ");
    const traits = [];

    const lowerCount = messages.filter(m => m === m.toLowerCase()).length;
    if (lowerCount > messages.length * 0.7) traits.push("mostly lowercase");
    else if (lowerCount < messages.length * 0.3) traits.push("uses proper capitalization");

    const avgLen = combined.length / messages.length;
    if (avgLen < 30) traits.push("short/concise messages");
    else if (avgLen > 100) traits.push("writes longer messages");

    const slangWords = ["lol", "lmao", "bruh", "ngl", "tbh", "fr", "lowkey", "highkey", "imo", "idk", "istg", "smh", "fam", "vibe", "bet", "cap", "sus", "no cap", "deadass", "slay", "ong", "wanna", "gonna"];
    const usedSlang = slangWords.filter(s => combined.toLowerCase().includes(s));
    if (usedSlang.length > 2) traits.push(`uses slang: ${usedSlang.slice(0, 5).join(", ")}`);

    const emojiMatch = combined.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
    if (emojiMatch && emojiMatch.length > 3) traits.push("uses emojis frequently");

    const exclamations = (combined.match(/!/g) || []).length;
    const questions = (combined.match(/\?/g) || []).length;
    if (exclamations > messages.length) traits.push("enthusiastic/exclamatory");
    if (questions > messages.length) traits.push("asks lots of questions");

    if (combined.includes("...")) traits.push("uses ellipses");

    return traits.join("; ");
}

/**
 * Get conversation history for a user
 */
function getHistory(userId) {
    return conversationCache.get(userId) || [];
}

/**
 * Add a message to conversation history
 */
function addToHistory(userId, role, content) {
    if (!conversationCache.has(userId)) {
        conversationCache.set(userId, []);
    }

    const history = conversationCache.get(userId);
    history.push({ role, content, timestamp: Date.now() });

    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
}

/**
 * Chat with Myra (Groq AI)
 * @param {string} userMessage - The user's message
 * @param {Object} context - Additional context
 * @returns {Promise<string|null>} Myra's response or null if unavailable
 */
async function chat(userMessage, context = {}) {
    if (!groqClient) return null;

    try {
        const userId = context.userId || "unknown";
        const username = context.username || "someone";

        // Add user message to history
        addToHistory(userId, "user", userMessage);

        // Get user's style profile
        const profile = await getUserProfile(userId);

        // Build conversation history for Groq messages format
        const history = getHistory(userId);

        // Build context string
        const contextParts = [];
        if (context.currentTime) contextParts.push(`Current UTC time: ${context.currentTime}`);
        if (context.guildName) contextParts.push(`Server: ${context.guildName}`);
        if (context.userTimezone) contextParts.push(`${username}'s timezone: ${context.userTimezone}`);

        let userStyleGuide = "";
        if (profile && profile.style_notes) {
            userStyleGuide = `\n\nThis user's style: ${profile.style_notes} (${profile.message_count || 0} messages exchanged). Mirror their style naturally.`;
        }

        const systemPrompt = `${MYRA_SYSTEM_PROMPT}${userStyleGuide}${contextParts.length > 0 ? "\n\nContext: " + contextParts.join(" | ") : ""}`;

        // Build messages array for Groq (OpenAI-compatible format)
        const messages = [
            { role: "system", content: systemPrompt }
        ];

        // Add recent conversation history
        const recentHistory = history.slice(-8);
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content
            });
        }

        // If the last message isn't the current user message, add it
        if (recentHistory.length === 0 || recentHistory[recentHistory.length - 1].content !== userMessage) {
            messages.push({ role: "user", content: userMessage });
        }

        // Try primary client, fallback if it fails
        let completion;
        try {
            completion = await groqClient.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages,
                max_tokens: 150,
                temperature: 0.9,
            });
        } catch (primaryError) {
            console.error("Primary AI key failed:", primaryError?.message);
            if (fallbackClient) {
                console.log("○ Switching to fallback AI key...");
                completion = await fallbackClient.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages,
                    max_tokens: 150,
                    temperature: 0.9,
                });
            } else {
                throw primaryError;
            }
        }

        const response = completion.choices[0]?.message?.content || "";

        // Parse out action tags
        const actionMatch = response.match(/\[ACTION:([^\]]+)\]/);
        let action = null;
        let cleanResponse = response;

        if (actionMatch) {
            cleanResponse = response.replace(/\[ACTION:[^\]]+\]/g, "").trim();
            const parts = actionMatch[1].split(":");
            action = {
                type: parts[0],
                params: parts.slice(1)
            };
            console.log(`◈ Myra action detected: ${action.type}`, action.params);
        }

        // Truncate for Discord
        let finalResponse = cleanResponse;
        if (finalResponse.length > 1900) {
            finalResponse = finalResponse.substring(0, 1897) + "...";
        }

        // Save Myra's response to history
        addToHistory(userId, "assistant", finalResponse);

        // Update user profile asynchronously
        const userMessages = history.filter(m => m.role === "user").map(m => m.content);
        updateUserProfile(userId, username, userMessages).catch(() => { });

        return { text: finalResponse, action };
    } catch (error) {
        console.error("AI error:", error?.message || error);
        return { text: "hmm something's off rn... try again in a sec", action: null };
    }
}

/**
 * Check if AI is available
 */
function isAvailable() {
    return groqClient !== null;
}

module.exports = {
    chat,
    isAvailable,
};
