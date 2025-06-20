window.analyzeMood = async function () {
  const webcamContainer = document.getElementById("webcam");
  const resultBox = document.getElementById("resultBox");

  resultBox.innerText = "🎥 Requesting camera...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    const video = document.createElement("video");
    video.autoplay = true;
    video.srcObject = stream;
    video.style.borderRadius = "12px";
    video.style.marginTop = "20px";

    // Очистити попередній контент
    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(video);

    resultBox.innerText = "✅ Camera started!";
  } catch (error) {
    console.error("Camera error:", error);
    resultBox.innerText = "❌ Could not access camera.";
  }
};
