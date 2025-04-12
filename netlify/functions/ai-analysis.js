// netlify/functions/ai-analysis.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://models.inference.ai.azure.com",
  dangerouslyAllowBrowser: true, // required for running GPT-4o from frontend call
});

export default async (req, res) => {
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

    return res.status(200).json({ message: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "AI analysis failed." });
  }
};