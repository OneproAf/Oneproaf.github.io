import { saveMood } from "./firebase.js";
import { renderRecommendation } from "./components/Recommendations.js";
import { renderMoodChart } from "./components/EmotionChart.js";

let model;
const video = document.getElementById("webcam");
const resultBox = document.getElementById("resultBox");

// 📸 Камера
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise(resolve => {
      video.onloadedmetadata = () => resolve(video);
    });
  } catch (err) {
    resultBox.innerHTML = "<p>⚠️ Please allow camera access.</p>";
  }
}

// 🧠 Модель BlazeFace
async function loadModel() {
  model = await blazeface.load();
  console.log("✅ BlazeFace model loaded");
}

// 🔍 Аналіз емоцій
async function analyzeMood() {
  if (!model) return;

  const predictions = await model.estimateFaces(video, false);

  if (predictions.length > 0) {
    const mood = getRandomMood();
    const recommendation = await fetchChatGPTRecommendation(mood);

    renderRecommendation(mood, recommendation);
    await saveMood(mood, recommendation);
    await renderMoodChart("moodChart");
  } else {
    resultBox.innerHTML = "<p>😐 No face detected. Try again.</p>";
  }
}

// 🎲 Симуляція емоції (тимчасово)
function getRandomMood() {
  const moods = ["Happy", "Sad", "Angry", "Calm", "Stressed", "Excited"];
  return moods[Math.floor(Math.random() * moods.length)];
}

// 🔁 Виклик проксі-сервера (локально або Render)
async function fetchChatGPTRecommendation(mood) {
  try {
    const res = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `I'm feeling ${mood}. What should I do?` })
    });

    const data = await res.json();
    return data.reply || "No response from AI.";
  } catch (error) {
    console.error("❌ Proxy error:", error);
    return "Error: Unable to connect to AI service.";
  }
}

// 🚀 Старт
(async () => {
  await setupCamera();
  await loadModel();
  await renderMoodChart("moodChart");
})();

// 👇 Робить analyzeMood доступним для кнопки з index.html
window.analyzeMood = analyzeMood;
