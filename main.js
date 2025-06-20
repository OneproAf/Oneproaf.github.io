
import Chart from 'chart.js/auto';

let model, webcam, moodChart;
let moodHistory = [];

async function loadModel() {
  const URL = "https://teachablemachine.withgoogle.com/models/6WobZImCA/";
  model = await tmImage.load(URL + "model.json", URL + "metadata.json");

  webcam = new tmImage.Webcam(200, 200, true);
  await webcam.setup();
  await webcam.play();
  window.requestAnimationFrame(loop);

  document.getElementById("webcam").appendChild(webcam.canvas);
}

async function loop() {
  webcam.update();
  window.requestAnimationFrame(loop);
}

window.analyzeMood = async function () {
  const resultBox = document.getElementById("resultBox");
  resultBox.innerText = "🔍 Scanning...";

  try {
    const prediction = await model.predict(webcam.canvas);
    const top = prediction.sort((a, b) => b.probability - a.probability)[0];
    const mood = top.className;
    const confidence = (top.probability * 100).toFixed(1);

    resultBox.innerText = `Mood: ${mood} (${confidence}%)`;
    moodHistory.push(mood);
    updateChart();
  } catch (error) {
    resultBox.innerText = "❌ Error analyzing mood.";
    console.error(error);
  }
};

function updateChart() {
  const counts = moodHistory.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(counts);
  const data = Object.values(counts);

  if (moodChart) moodChart.destroy();

  const ctx = document.getElementById("moodChart").getContext("2d");
  moodChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Mood Frequency",
        data: data,
        backgroundColor: "#00e676"
      }]
    },
    options: { responsive: true }
  });
}

(async () => {
  const resultBox = document.getElementById("resultBox");
  resultBox.innerText = "📷 Initializing camera...";
  try {
    await loadModel();
    resultBox.innerText = "✅ Ready! Click to scan.";
  } catch (err) {
    console.error(err);
    resultBox.innerText = "❌ Camera error. Try again.";
  }
})();

Container.appendChild(webcam.canvas);
    window.requestAnimationFrame(loop);
  }

  async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
  }

  async function predict() {
    const prediction = await model.predict(webcam.canvas);
    prediction.sort((a, b) => b.probability - a.probability);
    const mood = prediction[0].className;
    const confidence = prediction[0].probability.toFixed(2);

    resultBox.innerText = `Detected mood: ${mood} (${confidence})`;
    chatBox.innerText = await getRecommendations(mood);
    updateEmotionChart(mood);
  }

  scanBtn.addEventListener("click", async () => {
    resultBox.innerText = "📷 Loading model and starting camera...";
    await loadModel();
  });
});
