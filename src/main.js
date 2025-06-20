import { getRecommendations } from "./recommendations.js";
import { updateEmotionChart } from "./emotionChart.js";

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const snapBtn = document.getElementById("snapBtn");
  const webcamContainer = document.getElementById("webcam");
  const resultBox = document.getElementById("resultBox");
  const chatBox = document.getElementById("chatBox");
  let video, model;

  const modelURL = "https://teachablemachine.withgoogle.com/models/YOUR_MODEL_URL/";
  const modelJson = modelURL + "model.json";
  const metadataJson = modelURL + "metadata.json";

  async function setupCamera() {
    try {
      console.log("Requesting camera access...");
      video = document.createElement("video");
      video.width = 300;
      video.height = 300;
      video.autoplay = true;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      webcamContainer.innerHTML = "";
      webcamContainer.appendChild(video);
      console.log("Camera access granted. Loading model...");
      model = await tmImage.load(modelJson, metadataJson);
      resultBox.innerText = "✅ Camera ready. You can now take a photo.";
    } catch (err) {
      console.error("Camera access error:", err);
      resultBox.innerText = "❌ Error accessing camera: " + err.message;
    }
  }

  async function takeSnapshot() {
    if (!video || !model) {
      resultBox.innerText = "❌ Please start the camera first.";
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const prediction = await model.predict(canvas);
    prediction.sort((a, b) => b.probability - a.probability);
    const mood = prediction[0].className;
    const confidence = prediction[0].probability.toFixed(2);
    resultBox.innerText = `Detected mood: ${mood} (${confidence})`;

    chatBox.innerText = "⏳ Loading ChatGPT recommendations...";
    const recommendation = await getRecommendations(mood);
    chatBox.innerText = recommendation;
    updateEmotionChart(mood);
  }

  startBtn?.addEventListener("click", setupCamera);
  snapBtn?.addEventListener("click", takeSnapshot);
});
