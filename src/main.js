import { getRecommendations } from "./recommendations.js";
import { updateEmotionChart } from "./emotionChart.js";

const tmImage = window.tmImage;

document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const webcamContainer = document.getElementById("webcam");
  const resultBox = document.getElementById("resultBox");
  const chatBox = document.getElementById("chatBox");

  const modelURL = "https://teachablemachine.withgoogle.com/models/hJgnbEtCH/";
  const modelJson = modelURL + "model.json";
  const metadataJson = modelURL + "metadata.json";
  let model;

  scanBtn?.addEventListener("click", async () => {
    resultBox.innerText = "📷 Starting camera...";
    chatBox.innerText = "";
    webcamContainer.innerHTML = "";

    try {
      model = await tmImage.load(modelJson, metadataJson);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      video.width = 300;
      video.height = 300;
      webcamContainer.appendChild(video);

      // Зачекаємо поки відео прогрузиться
      await new Promise(res => setTimeout(res, 2000));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const prediction = await model.predict(canvas);
      prediction.sort((a, b) => b.probability - a.probability);
      const mood = prediction[0].className;
      const confidence = prediction[0].probability.toFixed(2);

      resultBox.innerText = `🧠 Mood: ${mood} (${confidence})`;

      // Зупинимо відео та закриємо камеру
      stream.getTracks().forEach(track => track.stop());
      webcamContainer.innerHTML = "";

      // AI рекомендації
      chatBox.innerText = "💬 Analyzing...";
      const response = await getRecommendations(mood);
      chatBox.innerText = response;

      // Графік
      updateEmotionChart(mood);

    } catch (err) {
      resultBox.innerText = "❌ Error: " + err.message;
      console.error(err);
    }
  });
});
