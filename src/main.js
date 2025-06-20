document.addEventListener("DOMContentLoaded", () => {
  const scanBtn = document.getElementById("scanBtn");
  const webcamContainer = document.getElementById("webcam");
  const resultBox = document.getElementById("resultBox");

  scanBtn.addEventListener("click", async () => {
    resultBox.innerText = "🎥 Requesting camera access...";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      resultBox.innerText = "❌ Camera not supported in this browser.";
      console.error("navigator.mediaDevices not available.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      const video = document.createElement("video");
      video.autoplay = true;
      video.srcObject = stream;
      video.style.borderRadius = "12px";
      video.style.marginTop = "20px";
      video.width = 300;

      webcamContainer.innerHTML = "";
      webcamContainer.appendChild(video);

      resultBox.innerText = "✅ Camera started. Looking good!";
    } catch (error) {
      console.error("Camera error:", error);
      resultBox.innerText = "❌ Error: " + error.message;
    }
  });
});
