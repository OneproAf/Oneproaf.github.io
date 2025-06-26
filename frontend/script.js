// --- Get DOM Elements (Old and New) ---

// Mood Scan & General Elements
const video = document.getElementById('video');
const overlayCanvas = document.getElementById('overlayCanvas');
const moodResult = document.getElementById('moodResult');
const recommendationsDiv = document.getElementById('recommendations');
const musicRecommendationsDiv = document.getElementById('musicRecommendations');
const moodChartCanvas = document.getElementById('moodChart');

// Screen Containers
const homeScreen = document.getElementById('home-screen');
const appScreens = document.getElementById('app-screens');
const scanSection = document.getElementById('scan-section');
const resultsSection = document.getElementById('results-section');
const chartSection = document.getElementById('chart-section');
const aiPsychologistScreen = document.getElementById('ai-psychologist-screen');
const scanHistoryScreen = document.getElementById('scan-history-screen');
const authScreen = document.getElementById('auth-screen');

// Home Screen Buttons
const scanMoodHomeBtn = document.getElementById('scanMoodBtn');
const aiPsychologistBtn = document.getElementById('aiPsychologistBtn');
const scanHistoryBtn = document.getElementById('scanHistoryBtn');
const authBtn = document.getElementById('authBtn');

// Scan Screen Action Buttons
const captureMoodBtn = document.getElementById('captureMoodBtn');
const imageUpload = document.getElementById('imageUpload');
const uploadImageBtn = document.getElementById('uploadImageBtn');

// AI Psychologist Chat Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

// Back Buttons
const backToHomeBtn1 = document.getElementById('backToHomeBtn1');
const backToHomeBtn2 = document.getElementById('backToHomeBtn2');
const backToHomeBtn3 = document.getElementById('backToHomeBtn3');
const backToHomeBtn4 = document.getElementById('backToHomeBtn4');
const backToHomeBtn5 = document.getElementById('backToHomeBtn5');
const backToHomeBtn6 = document.getElementById('backToHomeBtn6');

// --- State Variables ---
let chartInstance = null;
const moodHistory = [];


// --- Navigation Logic ---

function showScreen(screenToShow) {
    // Hide all app screens first
    scanSection.style.display = 'none';
    resultsSection.style.display = 'none';
    chartSection.style.display = 'none';
    aiPsychologistScreen.style.display = 'none';
    scanHistoryScreen.style.display = 'none';
    authScreen.style.display = 'none';

    if (screenToShow === homeScreen) {
        homeScreen.style.display = 'flex';
        appScreens.style.display = 'none';
        // Stop video if returning to home
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    } else {
        homeScreen.style.display = 'none';
        appScreens.style.display = 'block';
        screenToShow.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showScreen(homeScreen);
});


// --- Navigation Event Listeners ---

scanMoodHomeBtn.addEventListener('click', () => {
    showScreen(scanSection);
    startVideo();
});

aiPsychologistBtn.addEventListener('click', () => {
    showScreen(aiPsychologistScreen);
});

scanHistoryBtn.addEventListener('click', () => {
    showScreen(chartSection);
    if (chartInstance) {
        chartInstance.update();
    } else if (moodHistory.length > 0) {
        updateMoodChart(moodHistory[moodHistory.length - 1].mood);
    }
});

authBtn.addEventListener('click', () => {
    showScreen(authScreen);
});

// Add all back button listeners
[backToHomeBtn1, backToHomeBtn2, backToHomeBtn3, backToHomeBtn4, backToHomeBtn5, backToHomeBtn6].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => showScreen(homeScreen));
    }
});


// --- NEW: AI Psychologist Chat Logic ---

async function sendMessageToAI() {
    const userMessage = userInput.value.trim();
    if (userMessage === "") {
        return; // Do nothing if the input is empty
    }

    // Display user's message immediately
    const userMessageElem = document.createElement('p');
    userMessageElem.textContent = `You: ${userMessage}`;
    userMessageElem.style.textAlign = 'right';
    userMessageElem.style.color = '#ffffff';
    chatContainer.appendChild(userMessageElem);
    
    userInput.value = ""; // Clear the input box
    chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom

    try {
        const response = await fetch('https://oneproaf-github-io.onrender.com/api/psychologist-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiReply = data.reply;

        // Display AI's message
        const aiMessageElem = document.createElement('p');
        aiMessageElem.innerHTML = `<i>AI: ${aiReply}</i>`; // Use innerHTML to render formatted text if any
        aiMessageElem.style.color = '#a7ffeb';
        chatContainer.appendChild(aiMessageElem);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom

    } catch (error) {
        console.error("Error communicating with AI psychologist:", error);
        const errorElem = document.createElement('p');
        errorElem.textContent = "AI Assistant: Sorry, I'm having trouble connecting right now. Please try again later.";
        errorElem.style.color = '#ff8a80'; // Red color for error
        chatContainer.appendChild(errorElem);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Event listeners for the chat
sendMessageBtn.addEventListener('click', sendMessageToAI);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission on enter
        sendMessageToAI();
    }
});


// --- Video and Image Handling ---

async function startVideo() {
    try {
        video.style.display = 'block';
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Could not access the camera. Please check permissions.");
    }
}

captureMoodBtn.addEventListener('click', () => {
    // Create a canvas to capture the video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
        detectMood(blob);
    }, 'image/jpeg');
});

uploadImageBtn.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        video.style.display = 'none';
        detectMood(file);
    }
});

// --- Mood Detection Function (Updated for Backend API) ---

async function detectMood(imageData) {
    if (!imageData) {
        moodResult.textContent = "No image data provided.";
        showScreen(resultsSection);
        return;
    }

    // Show loading indicator
    moodResult.textContent = "Analyzing your mood...";
    showScreen(resultsSection);

    try {
        // Create FormData object
        const formData = new FormData();
        formData.append('image', imageData);

        // Send to backend API
        const response = await fetch('https://oneproaf-github-io.onrender.com/api/analyze-mood', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Call the existing displayMoodResult function with the response data
        displayMoodResult(data.mood, data.percentages);
        updateMoodChart(data.mood);

    } catch (error) {
        console.error("Error during mood detection:", error);
        moodResult.textContent = "Error analyzing mood. Please try again.";
        recommendationsDiv.innerHTML = '';
        musicRecommendationsDiv.innerHTML = '';
    }
}

function displayMoodResult(mood, expressions) {
    let moodText = '';
    let recommendations = '';
    let musicGenre = '';

    // Convert mood to lowercase for switch statement
    const moodLower = mood.toLowerCase();

    switch (moodLower) {
        case 'happy':
            moodText = 'Happy! ✨';
            recommendations = 'Keep up the great spirit! Share your joy with someone.';
            musicGenre = 'pop, cheerful, upbeat';
            break;
        case 'sad':
            moodText = 'Sad 😔';
            recommendations = 'It\'s okay to be sad sometimes. Try listening to calming music, talking to a friend, or going for a walk.';
            musicGenre = 'lofi, ambient, classical';
            break;
        case 'angry':
            moodText = 'Angry 😠';
            recommendations = 'Try taking a deep breath, counting to ten, or engaging in physical activity to let off some steam.';
            musicGenre = 'calm, instrumental, jazz';
            break;
        case 'surprised':
            moodText = 'Surprised 😮';
            recommendations = 'Something unexpected? Try writing down your thoughts or sharing what surprised you with someone.';
            musicGenre = 'folk, experimental';
            break;
        case 'neutral':
            moodText = 'Neutral 😐';
            recommendations = 'Everything is stable. Perhaps it\'s a good time to rest or do something that relaxes you.';
            musicGenre = 'chill, acoustic';
            break;
        case 'fearful':
            moodText = 'Fearful 😨';
            recommendations = 'It\'s natural to feel afraid. Try deep breathing exercises or talking to someone you trust.';
            musicGenre = 'calm, soothing, nature sounds';
            break;
        case 'disgusted':
            moodText = 'Disgusted 🤢';
            recommendations = 'Take a moment to process what you\'re feeling. Sometimes stepping away helps.';
            musicGenre = 'clean, fresh, uplifting';
            break;
        case 'confused':
            moodText = 'Confused 😕';
            recommendations = 'Confusion is a normal part of learning. Try breaking things down into smaller steps.';
            musicGenre = 'clear, structured, instrumental';
            break;
        case 'tired':
            moodText = 'Tired 😴';
            recommendations = 'Rest is important. Consider taking a short break or getting some sleep.';
            musicGenre = 'lullaby, ambient, peaceful';
            break;
        default:
            moodText = 'Mood not clearly defined.';
            recommendations = 'Your mood could not be determined. Please try again.';
            musicGenre = 'unknown';
            break;
    }

    // Add confidence percentage if available
    if (expressions && expressions[mood]) {
        moodText += ` (${(expressions[mood] * 100).toFixed(1)}%)`;
    }
    
    moodResult.textContent = moodText;
    recommendationsDiv.innerHTML = `<p>${recommendations}</p>`;
    musicRecommendationsDiv.innerHTML = `<p>Recommended music: ${musicGenre}</p><p>(Spotify API integration here)</p>`;
}

function updateMoodChart(currentMood) {
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    // Store mood in lowercase for consistency
    const moodLower = currentMood.toLowerCase();
    moodHistory.push({ time: timeLabel, mood: moodLower });
    if (moodHistory.length > 15) {
        moodHistory.shift();
    }

    const labels = moodHistory.map(entry => entry.time);
    const datasets = ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted', 'confused', 'tired'].map(mood => {
        const colorMap = {
            happy: '#00e676',
            sad: '#69f0ae',
            angry: '#FF5722',
            neutral: '#e0e0e0',
            surprised: '#00bcd4',
            fearful: '#9c27b0',
            disgusted: '#795548',
            confused: '#ff9800',
            tired: '#607d8b'
        };
        return {
            label: mood.charAt(0).toUpperCase() + mood.slice(1),
            data: moodHistory.map(entry => entry.mood === mood ? 1 : 0),
            borderColor: colorMap[mood] || '#cccccc',
            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Simplified for clarity
            tension: 0.3,
            fill: false
        };
    });

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(moodChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        stepSize: 1,
                        callback: (value) => (value === 1 ? 'Yes' : 'No'),
                        color: '#c0c0c0'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    title: { display: true, text: 'Detected', color: '#a7ffeb' }
                },
                x: {
                    ticks: { color: '#c0c0c0' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    title: { display: true, text: 'Time', color: '#a7ffeb' }
                }
            },
            plugins: {
                legend: { labels: { color: '#e0e0e0' } }
            }
        }
    });
}