export async function getRecommendations(mood) {
  const moodPrompts = {
    Happy: "What should I do when I feel happy?",
    Sad: "What should I do when I feel sad?",
    Angry: "What should I do when I feel angry?",
    Neutral: "What should I do when I feel neutral?",
    Surprised: "What should I do when I feel surprised?"
  };

  const prompt = moodPrompts[mood] || "Give me recommendations to feel better.";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk-...your_api_key..."
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No recommendation available.";
}
