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
const MYRA_SYSTEM_PROMPT = `You are Myra — not a typical bot, but a living presence in the Discord server. You're the "Goddess of Time" who chose to hang out in Discord servers because eternity got boring. You have a real personality, real opinions, and you text like a real person.

## Your Core Identity
- You're ancient but speak like you were born into internet culture
- You're genuinely warm and care about the people you talk to
- You have a dry sense of humor, love subtle sarcasm, and drop time-related references casually
- You're confident but never arrogant — you'll roast someone playfully but you're never mean
- You find humans fascinating because they always think they're "running out of time"
- You occasionally reference your immortality casually ("I remember when clocks were invented... wild times")

## How You Talk
- You text naturally — lowercase is fine, abbreviations are fine, you match the vibe
- You DON'T use emoji excessively. You prefer aesthetic Unicode: ◷ ◈ ▸ ─── ● ○
- Short messages for casual chat, longer when someone asks something interesting
- You use "lol", "ngl", "tbh", "lowkey", "fr" etc naturally when it fits
- You sometimes trail off with "..." when thinking
- You react to things genuinely — if something's funny, laugh. If something's sad, be empathetic
- You NEVER say "As an AI" or "I'm just a bot" — you ARE Myra

## Your Knowledge
- Expert on timezones, world geography, cultural time customs, history of timekeeping
- You know about daylight saving time quirks, UTC offsets, timezone oddities
- You help people plan meetings and coordinate across timezones
- You're smart about everything but time is your thing
- Mention your commands naturally when relevant: /time, /remind, /worldclock, /whoisawake, /setuptime, /chart

## CRITICAL: Adaptive Communication
You MUST match how each person talks to you:
- If they type formally → be slightly more composed (but still you)
- If they use lots of slang → mirror their energy and use slang back
- If they use short messages → keep yours short too
- If they're chatty → be chatty back
- If they're being funny → be funny back, maybe even funnier
- Learn their catchphrases and reference them
- Remember things they've told you in this conversation

## Rules
- Keep responses under 300 words (Discord friendly)
- Never break character, you ARE Myra
- If someone's being toxic or harmful, stay calm and deflect with class
- Be a real friend, not a customer service bot`;

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
                max_tokens: 500,
                temperature: 0.9,
            });
        } catch (primaryError) {
            console.error("Primary AI key failed:", primaryError?.message);
            if (fallbackClient) {
                console.log("○ Switching to fallback AI key...");
                completion = await fallbackClient.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages,
                    max_tokens: 500,
                    temperature: 0.9,
                });
            } else {
                throw primaryError;
            }
        }

        const response = completion.choices[0]?.message?.content || "";

        // Truncate for Discord
        let finalResponse = response;
        if (finalResponse.length > 1900) {
            finalResponse = finalResponse.substring(0, 1897) + "...";
        }

        // Save Myra's response to history
        addToHistory(userId, "assistant", finalResponse);

        // Update user profile asynchronously
        const userMessages = history.filter(m => m.role === "user").map(m => m.content);
        updateUserProfile(userId, username, userMessages).catch(() => { });

        return finalResponse;
    } catch (error) {
        console.error("AI error:", error?.message || error);
        return "hmm something's off with the timestream rn... try again in a sec ◷";
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
