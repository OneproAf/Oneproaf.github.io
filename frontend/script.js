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

// Back Buttons
const backToHomeBtn1 = document.getElementById('backToHomeBtn1');
const backToHomeBtn2 = document.getElementById('backToHomeBtn2');
const backToHomeBtn3 = document.getElementById('backToHomeBtn3');
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
    // Open the standalone AI chat page in the same tab
    window.location.href = 'ai-chat.html';
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
[backToHomeBtn1, backToHomeBtn2, backToHomeBtn3, backToHomeBtn5, backToHomeBtn6].forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => showScreen(homeScreen));
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

// --- Music Recommendations Function ---

async function getMusicRecommendations(mood) {
    try {
        const response = await fetch(`https://oneproaf-github-io.onrender.com/api/get-music?mood=${encodeURIComponent(mood)}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.playlists && data.playlists.length > 0) {
            const playlistsHTML = data.playlists.map(playlist => {
                // Extract playlist ID from URL
                const playlistId = playlist.url.split('/playlist/')[1]?.split('?')[0];
                return `
                    <div class="playlist-item" style="margin: 10px 0; padding: 10px; border: 1px solid #444; border-radius: 8px; background: rgba(255,255,255,0.05);">
                        <a href="${playlist.url}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                            <img src="${playlist.imageUrl}" alt="${playlist.name}" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;">
                            <span style="font-weight: 500; color: #a7ffeb;">${playlist.name}</span>
                        </a>
                        ${playlistId ? `<button onclick="getPlaylistTracks('${playlistId}', '${playlist.name}')" style="margin-left: auto; padding: 5px 10px; background: #1db954; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">View Tracks</button>` : ''}
                    </div>
                `;
            }).join('');
            
            musicRecommendationsDiv.innerHTML = `
                <h4 style="color: #a7ffeb; margin-bottom: 10px;">🎵 Music for Your Mood:</h4>
                ${playlistsHTML}
                <div id="trackList" style="margin-top: 15px;"></div>
            `;
        } else {
            musicRecommendationsDiv.innerHTML = '<p style="color: #888;">No music recommendations available for this mood.</p>';
        }
    } catch (error) {
        console.error('Error fetching music recommendations:', error);
        musicRecommendationsDiv.innerHTML = '<p style="color: #ff8a80;">Unable to load music recommendations.</p>';
    }
}

// New function to get playlist tracks
async function getPlaylistTracks(playlistId, playlistName) {
    const trackListDiv = document.getElementById('trackList');
    
    try {
        trackListDiv.innerHTML = '<p style="color: #a7ffeb;">Loading tracks...</p>';
        
        const response = await fetch(`https://oneproaf-github-io.onrender.com/api/get-playlist-tracks?playlistId=${encodeURIComponent(playlistId)}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.trackNames && data.trackNames.length > 0) {
            const tracksHTML = data.trackNames.map((trackName, index) => `
                <div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #888; margin-right: 10px;">${index + 1}.</span>
                    <span style="color: #e0e0e0;">${trackName}</span>
                </div>
            `).join('');
            
            trackListDiv.innerHTML = `
                <h5 style="color: #a7ffeb; margin: 15px 0 10px 0;">📝 Tracks in "${playlistName}":</h5>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px;">
                    ${tracksHTML}
                </div>
            `;
        } else {
            trackListDiv.innerHTML = '<p style="color: #888;">No tracks found in this playlist.</p>';
        }
    } catch (error) {
        console.error('Error fetching playlist tracks:', error);
        trackListDiv.innerHTML = '<p style="color: #ff8a80;">Unable to load tracks.</p>';
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
    getMusicRecommendations(mood);
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