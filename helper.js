const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const express = require("express");
const https = require("https"); // For the self-ping logic

// --- RENDER COMPATIBILITY LAYER ---
const app = express();
// Render automatically provides a PORT environment variable. 
// If it's not there (local testing), it defaults to 10000.
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
    res.send("Scorpio Professional Interface is active and running.");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Health check server live on port ${PORT}`);
});

// --- SCORPIO BOT LOGIC ---
const apiId = 28074028; 
const apiHash = "db286568b5fee52eb8543f8ab8825a6f";
const savedSession = new StringSession("1BAAOMTQ5LjE1NC4xNjcuOTEAUHhaoypLVBUJ6aAvTBKQY+D3zzhEEyUMTpPlp3wtT38N5wyblQ0scFL7BIvpe334lYK/yHghNeLGlvQlzBDV0aF7GgNU7/nl7j830dGPjPPR4DK6TMETTTja3Ccs69xbvk0oZjNfMN8JONnMCNEsfjjuA9M6YqUfhaG5ZKfgSASS9+tUAqM1wEUYyAmrj0dtu3xklvz4PmayAEYud9cRfhn6LMBUgj1yjfpoAgp5DlxH6ASxQ2XlsATcu0fRORU+ELUIGYXntfzgZb5/q/DJPezM5APQiQ1ZnLa09XG1gm6edXVHpbi0p1dzYR2m6zNSMuOEvA1pEP3BBU1+8BySjrs=");

const mutedUsers = new Set(); 
const personalClient = new TelegramClient(savedSession, apiId, apiHash, { connectionRetries: 5 });

(async () => {
    console.log("🚀 Connecting to Telegram...");
    await personalClient.connect();
    console.log("✅ Scorpio System Online.");

    // HEARTBEAT: Keep "Online" status visible
    setInterval(async () => {
        try {
            await personalClient.invoke(new Api.account.UpdateStatus({ offline: false }));
            await personalClient.getMe(); 
        } catch (e) {
            console.log("Heartbeat failed, retrying...");
        }
    }, 25000);

    personalClient.addEventHandler(async (event) => {
        const message = event.message;
        if (!message.peerId || !message.peerId.userId) return;
        const chatID = message.peerId.userId.toString();

        if (message.out) {
            if (!mutedUsers.has(chatID)) mutedUsers.add(chatID);
            return;
        }

        if (event.isPrivate && !mutedUsers.has(chatID)) {
            try {
                const sender = await message.getSender();
                const greeting = (sender && sender.firstName) ? `Greetings ${sender.firstName},` : `Greetings,`;

                await personalClient.invoke(new Api.messages.SetTyping({
                    peer: message.peerId,
                    action: new Api.SendMessageTypingAction(),
                }));
                
                await new Promise(r => setTimeout(r, 3000));

                await personalClient.sendMessage(message.peerId, {
                    message: `${greeting}\n\nWe have received your message. Your inquiry is being processed, and we will get back to you shortly.\n\nThank you for contacting Scorpio.`,
                    parseMode: "markdown"
                });

                mutedUsers.add(chatID); 
                console.log(`✅ Response sent to ${chatID}`);
            } catch (err) {
                console.error("Reply Error:", err.message);
            }
        }
    }, new NewMessage({}));
})();

// --- PREVENT SLEEP (KEEP-ALIVE) ---
// Changed to 10 minutes (600,000 ms) to ensure Render stays active
setInterval(() => {
    https.get(`https://tghelper-dkg4.onrender.com/`, (res) => {
        console.log(`Keep-alive ping status: ${res.statusCode} - System active.`);
    }).on('error', (e) => {
        console.log("Keep-alive ping failed:", e.message);
    });
}, 600000); // 10 minutes