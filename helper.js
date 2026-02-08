const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const express = require("express"); // Added for Render compatibility

// --- WEB SERVER FOR RENDER ---
const app = express();
const port = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Scorpio System Online ⚡"));
app.listen(port, () => console.log(`Health check listening on port ${port}`));

// --- BOT LOGIC ---
const apiId = 28074028; 
const apiHash = "db286568b5fee52eb8543f8ab8825a6f";
const savedSession = new StringSession("1BAAOMTQ5LjE1NC4xNjcuOTEAUHhaoypLVBUJ6aAvTBKQY+D3zzhEEyUMTpPlp3wtT38N5wyblQ0scFL7BIvpe334lYK/yHghNeLGlvQlzBDV0aF7GgNU7/nl7j830dGPjPPR4DK6TMETTTja3Ccs69xbvk0oZjNfMN8JONnMCNEsfjjuA9M6YqUfhaG5ZKfgSASS9+tUAqM1wEUYyAmrj0dtu3xklvz4PmayAEYud9cRfhn6LMBUgj1yjfpoAgp5DlxH6ASxQ2XlsATcu0fRORU+ELUIGYXntfzgZb5/q/DJPezM5APQiQ1ZnLa09XG1gm6edXVHpbi0p1dzYR2m6zNSMuOEvA1pEP3BBU1+8BySjrs=");

const mutedUsers = new Set(); 
const personalClient = new TelegramClient(savedSession, apiId, apiHash, { connectionRetries: 5 });

(async () => {
    console.log("🚀 Scorpio Professional Interface: Connecting...");
    await personalClient.connect();
    console.log("✅ System Online.");

    setInterval(async () => {
        try {
            await personalClient.invoke(new Api.account.UpdateStatus({ offline: false }));
            await personalClient.getMe(); 
        } catch (e) {}
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
            } catch (err) { console.error(err); }
        }
    }, new NewMessage({}));
})();