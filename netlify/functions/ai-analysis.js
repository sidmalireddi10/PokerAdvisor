// netlify/functions/ai-analysis.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN,
  baseURL: "https://models.inference.ai.azure.com",
});

export default async (request) => {
  try {
    const body = await request.json();
    const { hand, board, potSize, callAmount, position, style } = body;

    const prompt = `You are a professional poker player. Given the situation below, provide a strategic analysis and recommendation. Make sure to keep it concise and 6-7 sentences. Don't include asterisks around the title of each section, but start each section as a new paragraph:\n
Hand: ${hand.map((c) => `${c.value}${c.suit}`).join(", ")}\n
Board: ${board.filter(c => c.value && c.suit).map((c) => `${c.value}${c.suit}`).join(", ") || "N/A"}\n
Pot Size: $${potSize}, Call Amount: $${callAmount}\n
Player Position: ${position}\n
Player Style: ${style}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a professional poker advisor. Respond with a short and clear summary of the player's situation and a concise recommendation. Then provide the odds of them winning. Finally, list the exact cards needed to create the best hand. Format: Summary:, Recommendation:, Odds:, Needed Cards:. Don't include asterisks around the title of each section, but start each section on a new line. Limit to 7-8 sentences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    const message = response.choices?.[0]?.message?.content;

console.log("AI Message:", message);  // 🔍 Add this line

    if (!message) {
      console.error("OpenAI response did not include message content.", response);
      return new Response(JSON.stringify({ error: "No message returned from AI." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    return new Response(
      JSON.stringify({ error: error.toString() }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
