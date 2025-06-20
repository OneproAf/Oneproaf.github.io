import Chart from 'chart.js/auto';

let model, webcam, labelContainer, moodChart;
let moodHistory = [];

// Load Teachable Machine model and webcam
async function loadTeachableModel() {
  const URL = "https://teachablemachine.withgoogle.com/models/6WobZImCA/";
  model = await tmImage.load(URL + "model.json", URL + "metadata.json");

  webcam = new tmImage.Webcam(200, 200, true); // width, height, flip
  await webcam.setup(); // Ask for camera access
  await webcam.play();
  window.requestAnimationFrame(loop);

  document.getElementById("webcam").appendChild(webcam.canvas);
}

// Loop webcam frame
async function loop() {
  webcam.update();
  window.requestAnimationFrame(loop);
}

// Analyze mood from current frame
async function analyzeMood() {
  const prediction = await model.predict(webcam.canvas);
  const top = prediction.sort((a, b) => b.probability - a.probability)[0];

  const mood = top.className;
  const confidence = (top.probability * 100).toFixed(1) + "%";

  document.getElementById("resultBox").innerText = `You seem to be ${mood} (${confidence})`;

  moodHistory.push(mood);
  updateChart(mood);
  getChatGPTRecommendation(mood);
}

// Update bar chart with mood history
function updateChart(mood) {
  const moodCounts = moodHistory.reduce((acc, m) => {
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(moodCounts);
  const data = Object.values(moodCounts);

  if (moodChart) moodChart.destroy();

  const ctx = document.getElementById("moodChart").getContext("2d");
  moodChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Mood Frequency',
        data,
        backgroundColor: '#00c853'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

// Send mood to ChatGPT and get recommendation
async function getChatGPTRecommendation(mood) {
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `What should someone do when they feel ${mood}? Recommend 1 activity and 1 music genre.`,
      }),
    });

    const data = await response.json();
    const advice = data.reply || "No recommendation received.";
    document.getElementById("resultBox").innerText += `\n\n💡 ${advice}`;
  } catch (error) {
    console.error("ChatGPT error:", error);
  }
}

// Make function globally available
window.analyzeMood = analyzeMood;

// ✅ Викликаємо модель правильно
(async () => {
  await loadTeachableModel();
})();
