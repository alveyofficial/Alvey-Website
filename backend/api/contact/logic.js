const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../env/.env')});

// ──────────────────────────────────────────────────────────────────────────────
// main.tsx's contact form does NOT write to any Appwrite database collection.
// It calls appwrite.functions.createExecution("website-notifications", ...)
// which relays a discord embed via a webhook. we replicate that exact
// contract here instead of inventing a new database write. 
// see: functions/website-notifications/src/main.js on the main branch
// ──────────────────────────────────────────────────────────────────────────────
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

const sendContactMessage = async(name, email, message) =>{
    try{
        if(!webhookUrl){
            console.log("Error Sending Contact Message : DISCORD_WEBHOOK_URL is not configured");
            return "Discord webhook is not configured";
        }

        const fields = [
            { name: "name", value: String(name).slice(0, 1024), inline: false },
            { name: "email", value: String(email).slice(0, 1024), inline: false },
            { name: "message", value: String(message).slice(0, 1024), inline: false }
        ];

        const discordResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Alvey Website',
                embeds: [
                    {
                        title: '📩 **New Contact Message**',
                        fields,
                        timestamp: new Date().toISOString()
                    }
                ]
            })
        });

        if(!discordResponse.ok){
            const text = await discordResponse.text();
            console.log("Error Sending Contact Message : Discord webhook failed "+discordResponse.status+" "+text);
            return "Failed to send Discord notification";
        }

        return { success: true };
    } catch(err){
        console.log("Error Sending Contact Message : "+err.message);
        return err.message;
    }
};

module.exports = { sendContactMessage };