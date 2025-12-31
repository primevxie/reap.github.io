import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/webhook', async (req, res) => {
    const { error_type, stack_trace, app_version } = req.body;

    if (!stack_trace) return res.status(400).json({ error: 'No data' });

    const discordPayload = {
        username: "Reap Reporter",
        embeds: [{
            title: "⚠️ Client Crash",
            color: 14492192,
            fields: [
                { name: "Ver", value: app_version || "?", inline: true },
                { name: "Error", value: error_type || "?", inline: true },
                { name: "Trace", value: `\`\`\`${stack_trace.substring(0, 1000)}\`\`\`` }
            ]
        }]
    };

    try {
        await fetch(process.env.DISCORD_URL, {
            method: 'POST',
            body: JSON.stringify(discordPayload),
            headers: { 'Content-Type': 'application/json' }
        });
        res.json({ status: 'sent' });
    } catch (e) {
        res.status(500).json({ error: 'failed' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
