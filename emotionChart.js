export function updateEmotionChart(mood) {
  const ctx = document.getElementById("moodChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Mood"],
      datasets: [{
        label: mood,
        data: [1],
        backgroundColor: "#00c853"
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 1
        }
      }
    }
  });
}
