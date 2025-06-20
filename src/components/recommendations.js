export async function getRecommendations(mood) {
  const OPENAI_API_KEY = "sk-xxxx"; // Replace with your actual OpenAI key

  const prompt = `My current mood is ${mood}. Give me 2 recommendations and 1 music genre I should listen to.`;

  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt,
      max_tokens: 100
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.text?.trim() || "No recommendations available.";
}
