import { saveMood } from "./firebase.js";
import { renderRecommendation } from "./components/Recommendations.js";
import { renderMoodChart } from "./components/EmotionChart.js";

let model, webcam, labelContainer;

// 📦 Teachable Machine модель
const URL = "https://teachablemachine.withgoogle.com/models/6WobZImCA/";

async function loadTeachableModel() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  console.log("✅ Teachable Machine model loaded");

  webcam = new tmImage.Webcam(200, 200, true); // ширина, висота, фронтальна
  await webcam.setup(); // доступ до камери
  await webcam.play();
  window.requestAnimationFrame(loop);

  document.getElementById("webcam").appendChild(webcam.canvas);
  labelContainer = document.getElementById("resultBox");
  for (let i = 0; i < model.getTotalClasses(); i++) {
    labelContainer.appendChild(document.createElement("div"));
  }
}

async function loop() {
  webcam.update();
  window.requestAnimationFrame(loop);
}

async function predictMood() {
  const prediction = await model.predict(webcam.canvas);
  prediction.sort((a, b) => b.probability - a.probability);
  const topMood = prediction[0].className;
  return topMood;
}

async function analyzeMood() {
  const mood = await predictMood();
  const recommendation = await fetchChatGPTRecommendation(mood);

  renderRecommendation(mood, recommendation);
  await saveMood(mood, recommendation);
  await renderMoodChart("moodChart");
}

async function fetchChatGPTRecommendation(mood) {
  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `I'm feeling ${mood}. What should I do?`
      })
    });

    const data = await res.json();
    return data.reply || "No response from AI.";
  } catch (error) {
    console.error("❌ Proxy error:", error);
    return "Error: Unable to connect to AI.";
  }
}

(async () => {
  await loadTeachableModel();
  await renderMoodChart("moodChart");
window.analyzeMood = analyzeMood;
})();

window.analyzeMood = analyzeMood;
