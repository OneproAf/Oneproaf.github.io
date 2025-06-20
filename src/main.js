import { saveMood } from "./firebase.js";
import { renderRecommendation } from "./components/Recommendations.js";
import { renderMoodChart } from "./components/EmotionChart.js";

let model;
const video = document.getElementById("webcam");
const resultBox = document.getElementById("resultBox");

// 📸 Налаштування камери
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

// 🧠 Завантаження моделі BlazeFace
async function loadModel() {
  model = await blazeface.load();
  console.log("✅ BlazeFace model loaded");
}

// 🔍 Аналіз емоцій
async function analyzeMood() {
  if (!model) return;

  const predictions = await model.estimateFaces(video, false);

  if (predictions.length > 0) {
    const mood = getRandomMood(); // тимчасовий симулятор
    const recommendation = await fetchChatGPTRecommendation(mood);

    renderRecommendation(mood, recommendation);
    await saveMood(mood, recommendation);
    await renderMoodChart("moodChart");
  } else {
    resultBox.innerHTML = "<p>😐 No face detected. Try again.</p>";
  }
}

// 🎲 Симуляція емоції
function getRandomMood() {
  const moods = ["Happy", "Sad", "Angry", "Calm", "Stressed", "Excited"];
  return moods[Math.floor(Math.random() * moods.length)];
}

// 🤖 Виклик ChatGPT через проксі
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
    return "Error: Unable to connect to AI service.";
  }
}

// 🚀 Ініціалізація після завантаження сторінки
(async () => {
  await setupCamera();
  await loadModel();
  await renderMoodChart("moodChart");
})();

// ✅ Важливо для кнопки в HTML
window.analyzeMood = analyzeMood;
