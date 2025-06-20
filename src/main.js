window.analyzeMood = async function () {
  const webcamContainer = document.getElementById("webcam");
  const resultBox = document.getElementById("resultBox");

  resultBox.innerText = "🎥 Trying to access camera...";

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    resultBox.innerText = "❌ Camera API not supported in this browser.";
    console.error("❌ navigator.mediaDevices not available.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    const video = document.createElement("video");
    video.autoplay = true;
    video.srcObject = stream;
    video.style.borderRadius = "12px";
    video.style.marginTop = "20px";

    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(video);

    resultBox.innerText = "✅ Camera started!";
  } catch (error) {
    console.error("Camera error:", error);
    resultBox.innerText = "❌ Error: " + error.name;
  }
};
