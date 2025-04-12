// ai-analysis-server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

app.post("/ai-analysis", async (req, res) => {
  try {
    const { hand, board, potSize, callAmount, position, style } = req.body;

    const prompt = `You are a professional poker player. Given the situation below, provide a strategic analysis and recommendation. Make sure to keep it concise and 6-7 sentences. Don't include asterisks around the title of each section, but start each section as a new paragraph:\n
Hand: ${hand.map((c) => `${c.value}${c.suit}`).join(", ")}\n
Board: ${board.map((c) => `${c.value}${c.suit}`).join(", ") || "N/A"}\n
Pot Size: $${potSize}, Call Amount: $${callAmount}\n
Player Position: ${position}\n
Player Style: ${style}\n`;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional poker advisor. Respond with a short and clear summary of the player's situation and a concise recommendation. Then provide the odds of them winning. Finally, list the exact cards needed to create the best hand. Format: Summary, Recommendation, Odds, Needed Cards. Don't include asterisks around the title of each section, but start each section on a new line ",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    res.json({ message: response.choices[0].message.content });
  } catch (err) {
    console.error("AI analysis error:", err);
    res.status(500).json({ error: "Failed to fetch AI analysis." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI server running on http://localhost:${PORT}`);
});
