import { getRecommendations } from "./recommendations.js";
import { updateEmotionChart } from "./emotionChart.js";

document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const webcamContainer = document.getElementById("webcam");
  const resultBox = document.getElementById("resultBox");
  const chatBox = document.getElementById("chatBox");
  let model;

  const modelURL = "https://teachablemachine.withgoogle.com/models/G7S2GJZC8/"; // приклад моделі
  const modelJson = modelURL + "model.json";
  const metadataJson = modelURL + "metadata.json";

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

        await new Promise((res) => setTimeout(res, 1500)); // чекати 1.5 сек

        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const prediction = await model.predict(canvas);
        prediction.sort((a, b) => b.probability - a.probability);
        const mood = prediction[0].className;
        const confidence = prediction[0].probability.toFixed(2);
        resultBox.innerText = `🧠 Mood: ${mood} (${confidence})`;

        stream.getTracks().forEach(track => track.stop());
        video.remove();

        chatBox.innerText = "💬 ChatGPT is thinking...";
        const response = await getRecommendations(mood);
        chatBox.innerText = response;

        updateEmotionChart(mood);
      };
    } catch (err) {
      resultBox.innerText = "❌ Error: " + err.message;
      console.error(err);
    }
  });
});
