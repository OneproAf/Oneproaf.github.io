// server.js - Проксі-сервер для ChatGPT (Node.js + Express)

import express from "express"; import cors from "cors"; import dotenv from "dotenv"; import fetch from "node-fetch";

dotenv.config(); const app = express(); const PORT = process.env.PORT || 5000;

app.use(cors()); app.use(express.json());

app.post("/chat", async (req, res) => { const userMessage = req.body.message;

try { const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": Bearer ${process.env.OPENAI_API_KEY} }, body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [ { role: "system", content: "You are a helpful mental wellness assistant." }, { role: "user", content: userMessage } ] }) });

const data = await openaiRes.json();
res.json({ reply: data.choices?.[0]?.message?.content });

} catch (error) { console.error("Error contacting OpenAI:", error); res.status(500).json({ error: "Something went wrong." }); } });

app.listen(PORT, () => console.log(✅ Server running on http://localhost:${PORT}));

