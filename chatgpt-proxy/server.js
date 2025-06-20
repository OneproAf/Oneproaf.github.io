import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful mental wellness assistant." },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await openaiRes.json();
    res.json({ reply: data.choices?.[0]?.message?.content });

  } catch (err) {
    console.error("❌ OpenAI error:", err);
    res.status(500).json({ error: "Something went wrong with OpenAI." });
  }
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

