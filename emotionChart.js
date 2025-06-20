export function updateEmotionChart(mood) {
  const chartEl = document.getElementById("moodChart");
  if (!window.emotionChart) {
    window.emotionChart = new Chart(chartEl, {
      type: "bar",
      data: {
        labels: ["Happy", "Sad", "Angry", "Neutral", "Surprised"],
        datasets: [{
          label: "Mood Frequency",
          data: [0, 0, 0, 0, 0],
          backgroundColor: "#00c853"
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  const index = window.emotionChart.data.labels.indexOf(mood);
  if (index !== -1) {
    window.emotionChart.data.datasets[0].data[index]++;
    window.emotionChart.update();
  }
}
