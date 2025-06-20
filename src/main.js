import { getRecommendations } from "./recommendations.js";
import { updateEmotionChart } from "./emotionChart.js";

// Взято з глобального <script> teachablemachine-image
const tmImage = window.tmImage;

document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const webcamContainer = document.getElementById("webcam");
  const resultBox = document.getElementById("resultBox");
  const chatBox = document.getElementById("chatBox");

  // Вкажи тут свою модель з Teachable Machine
  const modelURL = "https://teachablemachine.withgoogle.com/models/G7S2GJZC8/";
  const modelJson = modelURL + "model.json";
  const metadataJson = modelURL + "metadata.json";
  let model;

  scanBtn?.addEventListener("click", async () => {
    resultBox.innerText = "📷 Starting camera...";
    chatBox.innerText = "";

    try {
      model = await tmImage.load(modelJson, metadataJson);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = async () => {
        video.width = 300;
        video.height = 300;
        webcamContainer.innerHTML = "";
        webcamContainer.appendChild(video);

        // Дати 1.5 секунди камері "прокинутись"
        await new Promise((res) => setTimeout(res, 1500));

        // Створити зображення з відео
        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Прогноз
        const prediction = await model.predict(canvas);
        prediction.sort((a, b) => b.probability - a.probability);
        const mood = prediction[0].className;
        const confidence = prediction[0].probability.toFixed(2);
        resultBox.innerText = `🧠 Mood: ${mood} (${confidence})`;

        // Зупинити камеру
        stream.getTracks().forEach(track => track.stop());
        video.remove();

        // Відправити до ChatGPT
        chatBox.innerText = "💬 AI analyzing...";
        const response = await getRecommendations(mood);
        chatBox.innerText = response;

        // Побудувати графік
        updateEmotionChart(mood);
      };
    } catch (err) {
      resultBox.innerText = "❌ Error: " + err.message;
      console.error(err);
    }
  });
});
