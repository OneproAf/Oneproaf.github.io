// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUXCEJvZf7n3QRk4R_e9VLgErpkZUfMd8",
  authDomain: "moodscanai.firebaseapp.com",
  projectId: "moodscanai",
  storageBucket: "moodscanai.firebasestorage.app",
  messagingSenderId: "704272501014",
  appId: "1:704272501014:web:5683f652cfce7f171a2837",
  measurementId: "G-9GC23KKV3G"
};

// Initialize Firebase (using v8 namespaced API) - with safety check
let auth, db, googleProvider;

function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        console.log('Firebase is available, initializing...');
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        console.log('Firebase initialized successfully');
    } else {
        console.log('Firebase not available yet, retrying in 100ms...');
        setTimeout(initializeFirebase, 100);
    }
}

// Start Firebase initialization
initializeFirebase();

// --- State Variables ---
let chartInstance = null;
const moodHistory = [];
let latestScanData = null;

// --- Navigation Logic ---

function setLanguage(lang) {
    localStorage.setItem('language', lang);
    const elements = document.querySelectorAll('[data-i18n-key]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            }).catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    }
}

function showScreen(screenToShow) {
    // Hide all screen sections first
    const allScreens = document.querySelectorAll('#mainContent > .screen');
    allScreens.forEach(screen => {
        screen.style.display = 'none';
    });

    // Handle both DOM elements and string IDs
    let targetScreen = screenToShow;
    if (typeof screenToShow === 'string') {
        targetScreen = document.getElementById(screenToShow);
    }

    // Show the target screen
    if (targetScreen) {
        // The home screen uses flexbox for its layout
        targetScreen.style.display = (targetScreen.id === 'home-screen') ? 'flex' : 'block';
    }

    // Stop video if navigating away from the scan screen
    const video = document.getElementById('video');
    if (targetScreen !== document.getElementById('scan-mood-screen') && video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be ready before proceeding
    function waitForFirebase() {
        if (auth && db && googleProvider) {
            console.log('Firebase is ready, starting application...');
            startApplication();
        } else {
            console.log('Waiting for Firebase to be ready...');
            setTimeout(waitForFirebase, 100);
        }
    }

    function startApplication() {
        // --- Get DOM Elements (Old and New) ---

        // Mood Scan & General Elements
        const video = document.getElementById('video');
        const overlayCanvas = document.getElementById('overlayCanvas');
        const moodResult = document.getElementById('moodResult');
        const recommendationsDiv = document.getElementById('recommendations');
        const musicRecommendationsDiv = document.getElementById('musicRecommendations');

        // Screen Containers
        const homeScreen = document.getElementById('home-screen');
        const scanSection = document.getElementById('scan-mood-screen');
        const resultsSection = document.getElementById('results-section');
        const scanHistoryScreen = document.getElementById('scan-history-screen');
        const authScreen = document.getElementById('auth-screen');
        const pricingScreen = document.getElementById('pricing-screen');
        const moodHistoryDashboardScreen = document.getElementById('mood-history-dashboard-screen');
        const wellnessContentScreen = document.getElementById('wellness-content-screen');
        const privacyPolicyScreen = document.getElementById('privacy-policy-screen');
        const projectSupportScreen = document.getElementById('project-support-screen');

        // Home Screen Buttons
        const scanMoodHomeBtn = document.getElementById('scanMoodHomeBtn');
        const aiPsychologistBtn = document.getElementById('aiPsychologistBtn');
        const scanHistoryBtn = document.getElementById('scanHistoryBtn');
        const pricingBtn = document.getElementById('pricingBtn');
        const wellnessBtn = document.getElementById('wellnessBtn');
        const authBtn = document.getElementById('authBtn');
        const privacyLink = document.getElementById('privacy-link');
        const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
        const projectSupportBtn = document.getElementById('project-support-btn');

        // Scan Screen Action Buttons
        const captureMoodBtn = document.getElementById('captureMoodBtn');
        const imageUpload = document.getElementById('imageUpload');
        const uploadImageBtn = document.getElementById('uploadImageBtn');

        // Back Buttons
        const backToHomeBtn1 = document.getElementById('backToHomeBtn1');
        const backToHomeBtn2 = document.getElementById('backToHomeBtn2');
        const backToHomeBtn5 = document.getElementById('backToHomeBtn5');
        const backToHomeBtn6 = document.getElementById('backToHomeBtn6');
        const backToHomeBtn7 = document.getElementById('backToHomeBtn7');
        const backToHomeBtn8 = document.getElementById('backToHomeBtn8');
        const backToHomeBtn9 = document.getElementById('backToHomeBtn9');
        const backToHomeBtn10 = document.getElementById('backToHomeBtn10');

        // Auth Elements
        const registerForm = document.getElementById('register-form');
        const loginForm = document.getElementById('login-form');
        const googleSignInBtn = document.getElementById('google-signin-btn');
        const streakDisplay = document.getElementById('streak-display');
        const streakCount = document.getElementById('streak-count');

        // Auth form switching elements
        const switchToRegisterBtn = document.getElementById('switch-to-register');
        const switchToLoginBtn = document.getElementById('switch-to-login');
        const loginContainer = document.getElementById('login-container');
        const registerContainer = document.getElementById('register-container');

        // --- Language Switcher Logic ---
        const savedLanguage = localStorage.getItem('language') || 'en';
        setLanguage(savedLanguage);

        document.getElementById('lang-en-btn').addEventListener('click', () => setLanguage('en'));
        document.getElementById('lang-ua-btn').addEventListener('click', () => setLanguage('ua'));
        document.getElementById('lang-es-btn').addEventListener('click', () => setLanguage('es'));

        registerServiceWorker();

        // --- Theme Switcher Logic ---
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        const body = document.body;

        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                themeToggleBtn.textContent = '☀️';
            } else {
                body.classList.remove('dark-mode');
                themeToggleBtn.textContent = '🌙';
            }
        };

        themeToggleBtn.addEventListener('click', () => {
            const isDarkMode = body.classList.contains('dark-mode');
            const newTheme = isDarkMode ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });

        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
        applyTheme(savedTheme);

        // --- Screen & Initial Setup ---
        showScreen(homeScreen);

        // --- Navigation Event Listeners ---

        // --- Navigation ---
        const navButtons = {
            scanHistoryBtn, pricingBtn, wellnessBtn, authBtn, privacyLink
        };

        for (const button in navButtons) {
            if (navButtons[button]) {
                navButtons[button].addEventListener('click', () => {
                    const screenId = button.split('Btn')[0] + '-screen';
                    showScreen(screenId);
                });
            }
        }

        // Fix back to home buttons - all should go to home-screen and reload
        const allBackButtons = document.querySelectorAll('.back-button');
        allBackButtons.forEach((button) => {
            button.addEventListener('click', () => {
                window.location.href = '/';
            });
        });

        if (scanMoodHomeBtn) {
            scanMoodHomeBtn.addEventListener('click', () => {
                showScreen(scanSection);
                startVideo();
            });
        }

        if (aiPsychologistBtn) {
            aiPsychologistBtn.addEventListener('click', () => {
                // Open the standalone AI chat page in the same tab
                window.location.href = 'ai_chat/index.html';
            });
        }

        if (scanHistoryBtn) {
            scanHistoryBtn.addEventListener('click', renderDashboardCharts);
        }

        if (wellnessBtn) {
            wellnessBtn.addEventListener('click', () => {
                showScreen(wellnessContentScreen);
            });
        }

        if (privacyLink) {
            privacyLink.addEventListener('click', (event) => {
                event.preventDefault();
                showScreen(privacyPolicyScreen);
            });
        }

        if (pricingBtn) {
            pricingBtn.addEventListener('click', () => {
                showScreen(pricingScreen);
            });
        }

        if (authBtn) {
            authBtn.addEventListener('click', () => {
                showScreen(authScreen);
            });
        }

        if (projectSupportBtn) {
            projectSupportBtn.addEventListener('click', function() {
                showScreen(projectSupportScreen);
            });
        }

        // --- Firebase Auth Logic ---

        // Register
        async function handleRegistration(event) {
            event.preventDefault();
            const email = registerForm['register-email'].value;
            const password = registerForm['register-password'].value;

            try {
                await auth.createUserWithEmailAndPassword(email, password);
                alert('Registration successful!');
                registerForm.reset();
                showScreen(homeScreen); // Or a dashboard screen
            } catch (error) {
                console.error('Registration Error:', error.message);
                alert(`Registration failed: ${error.message}`);
            }
        }

        // Login
        async function handleLogin(event) {
            event.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                alert('Login successful!');
                loginForm.reset();
                showScreen(homeScreen); // Or a dashboard screen
            } catch (error) {
                console.error('Login Error:', error.message);
                alert(`Login failed: ${error.message}`);
            }
        }

        // Google Sign-In
        async function handleGoogleSignIn() {
            try {
                await auth.signInWithPopup(googleProvider);
                alert('Google Sign-In successful!');
                showScreen(homeScreen); // Or a dashboard screen
            } catch (error) {
                console.error('Google Sign-In Error:', error.message);
                alert(`Google Sign-In failed: ${error.message}`);
            }
        }

        // Auth State Observer
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log('User is logged in:', user.email);
                streakDisplay.style.display = 'block';
                // Here you can update the UI to show user is logged in
                // For example, change 'Login' button to 'Logout'
            } else {
                console.log('User is logged out');
                streakDisplay.style.display = 'none';
                // Here you can update the UI for a logged-out state
            }
        });


        // --- Auth Event Listeners ---
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegistration);
        }
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', handleGoogleSignIn);
        }


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

        if (captureMoodBtn) {
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
        }

        if (uploadImageBtn) {
            uploadImageBtn.addEventListener('click', () => imageUpload.click());
        }

        if (imageUpload) {
            imageUpload.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) {
                    video.style.display = 'none';
                    detectMood(file);
                }
            });
        }

        // --- Mood Detection Function (Updated for Backend API) ---

        async function detectMood(imageData) {
            if (!imageData) {
                moodResult.textContent = "No image data provided.";
                showScreen(resultsSection);
                return;
            }

            // Show loading indicator
            moodResult.textContent = "Analyzing your mood...";
            recommendationsDiv.innerHTML = '';
            musicRecommendationsDiv.innerHTML = '';
            showScreen(resultsSection);

            try {
                // Send the image to the backend for analysis
                const formData = new FormData();
                formData.append('image', imageData, 'mood-scan.jpg');

                const fetchOptions = {
                    method: 'POST',
                    body: formData
                };

                // Add authorization header if user is logged in
                if (auth.currentUser) {
                    const idToken = await auth.currentUser.getIdToken();
                    fetchOptions.headers = {
                        'Authorization': `Bearer ${idToken}`
                    };
                }

                const response = await fetch(config.apiUrl('/api/analyze-mood'), fetchOptions);

                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Update the streak display if the data is available
                if (data.currentStreak) {
                    streakCount.textContent = data.currentStreak;
                }

                // Save the entire result to the global variable
                latestScanData = data;

                // Save to Firestore if a user is logged in
                if (auth.currentUser) {
                    console.log('User logged in, saving mood data...');
                    const moodData = {
                        mood: data.mood,
                        expressions: data.percentages,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    try {
                        const docRef = await db.collection('users').doc(auth.currentUser.uid).collection('moodScans').add(moodData);
                        console.log('Mood data saved successfully with ID:', docRef.id);
                    } catch (error) {
                        console.error('Error saving mood data to Firestore:', error);
                    }
                } else {
                    console.log('No user logged in, skipping save.');
                }

                // Call the existing displayMoodResult function with the response data
                displayMoodResult(data.mood, data.percentages);
                // updateMoodChart(data.mood); // This is now replaced by displayMoodHistory

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
                const response = await fetch(config.apiUrl(`/api/get-music?mood=${encodeURIComponent(mood)}`));
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Clear the recommendations div
                musicRecommendationsDiv.innerHTML = '';
                
                // Display tracks if available
                if (data.tracks && data.tracks.length > 0) {
                    const tracksHTML = data.tracks.map(track => `
                        <div class="track-item" style="margin: 10px 0; padding: 10px; border: 1px solid #444; border-radius: 8px; background: rgba(255,255,255,0.05);">
                            <a href="${track.url}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                                <img src="${track.imageUrl}" alt="${track.name}" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;">
                                <div>
                                    <div style="font-weight: 500; color: #a7ffeb;">${track.name}</div>
                                    <div style="font-size: 12px; color: #888;">${track.artist}</div>
                                </div>
                            </a>
                        </div>
                    `).join('');
                    
                    musicRecommendationsDiv.innerHTML += `
                        <h4 style="color: #a7ffeb; margin-bottom: 10px;">🎵 Top Song Recommendations:</h4>
                        ${tracksHTML}
                    `;
                }
                
                // Display playlists if available
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
                    
                    musicRecommendationsDiv.innerHTML += `
                        <h4 style="color: #a7ffeb; margin: 20px 0 10px 0;">📋 Playlist Recommendations:</h4>
                        ${playlistsHTML}
                        <div id="trackList" style="margin-top: 15px;"></div>
                    `;
                }
                
                // Show message if no recommendations available
                if ((!data.tracks || data.tracks.length === 0) && (!data.playlists || data.playlists.length === 0)) {
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
                
                const response = await fetch(config.apiUrl(`/api/get-playlist-tracks?playlistId=${encodeURIComponent(playlistId)}`));
                
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

        // YouTube Music Recommendations Function (Premium feature)
        async function getYouTubeMusicRecommendations(mood) {
            const youtubeRecommendationsDiv = document.getElementById('youtube-recommendations');
            
            if (!youtubeRecommendationsDiv) {
                console.warn('YouTube recommendations div not found');
                return;
            }
            
            youtubeRecommendationsDiv.innerHTML = '<p style="color: #ff0000;">Loading YouTube Music recommendations...</p>';
            
            try {
                const response = await fetch(config.apiUrl(`/api/get-youtube-music?mood=${encodeURIComponent(mood)}`));
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.playlists && data.playlists.length > 0) {
                    const playlistsHTML = data.playlists.map(playlist => `
                        <div class="youtube-playlist-item" style="margin: 10px 0; padding: 10px; border: 1px solid #444; border-radius: 8px; background: rgba(255,255,255,0.05);">
                            <a href="${playlist.url}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                                <img src="${playlist.thumbnail}" alt="${playlist.title}" style="width: 120px; height: 90px; border-radius: 4px; object-fit: cover;">
                                <div>
                                    <div style="font-weight: 500; color: #ff0000;">${playlist.title}</div>
                                    <div style="font-size: 12px; color: #888;">${playlist.channelTitle}</div>
                                </div>
                            </a>
                        </div>
                    `).join('');
                    
                    youtubeRecommendationsDiv.innerHTML = `
                        <h4 style="color: #ff0000; margin-bottom: 10px;">🎵 YouTube Music Recommendations:</h4>
                        ${playlistsHTML}
                    `;
                } else {
                    // Fallback: Show recommended songs when API returns no results
                    showFallbackYouTubeRecommendations(mood, youtubeRecommendationsDiv);
                }
            } catch (error) {
                console.error('Error fetching YouTube music recommendations:', error);
                // Fallback: Show recommended songs when API fails
                showFallbackYouTubeRecommendations(mood, youtubeRecommendationsDiv);
            }
        }

        // Fallback function to show recommended songs when YouTube API is unavailable
        function showFallbackYouTubeRecommendations(mood, container) {
            const moodRecommendations = {
                'happy': [
                    {
                        title: "Blinding Lights",
                        artist: "The Weeknd",
                        url: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
                        thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg"
                    },
                    {
                        title: "Levitating",
                        artist: "Dua Lipa",
                        url: "https://www.youtube.com/watch?v=TUVcZfQe-Kw",
                        thumbnail: "https://i.ytimg.com/vi/TUVcZfQe-Kw/mqdefault.jpg"
                    },
                    {
                        title: "Sunflower",
                        artist: "Post Malone & Swae Lee",
                        url: "https://www.youtube.com/watch?v=ApXoWvfEYVU",
                        thumbnail: "https://i.ytimg.com/vi/ApXoWvfEYVU/mqdefault.jpg"
                    },
                    {
                        title: "Sugar",
                        artist: "Maroon 5",
                        url: "https://www.youtube.com/watch?v=09R8_2nJtjg",
                        thumbnail: "https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg"
                    },
                    {
                        title: "Shape of You",
                        artist: "Ed Sheeran",
                        url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
                        thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg"
                    },
                    {
                        title: "Dance Monkey",
                        artist: "Tones and I",
                        url: "https://www.youtube.com/watch?v=q0hyYWKXF0Q",
                        thumbnail: "https://i.ytimg.com/vi/q0hyYWKXF0Q/mqdefault.jpg"
                    },
                    {
                        title: "Watermelon Sugar",
                        artist: "Harry Styles",
                        url: "https://www.youtube.com/watch?v=7-x3uD5z1bQ",
                        thumbnail: "https://i.ytimg.com/vi/7-x3uD5z1bQ/mqdefault.jpg"
                    },
                    {
                        title: "Don't Start Now",
                        artist: "Dua Lipa",
                        url: "https://www.youtube.com/watch?v=oygrmJFKYZY",
                        thumbnail: "https://i.ytimg.com/vi/oygrmJFKYZY/mqdefault.jpg"
                    }
                ],
                'sad': [
                    {
                        title: "Someone You Loved",
                        artist: "Lewis Capaldi",
                        url: "https://www.youtube.com/watch?v=zABLecsR5UE",
                        thumbnail: "https://i.ytimg.com/vi/zABLecsR5UE/mqdefault.jpg"
                    },
                    {
                        title: "Before You Go",
                        artist: "Lewis Capaldi",
                        url: "https://www.youtube.com/watch?v=Jtauh8GcxBY",
                        thumbnail: "https://i.ytimg.com/vi/Jtauh8GcxBY/mqdefault.jpg"
                    },
                    {
                        title: "Lovely",
                        artist: "Billie Eilish & Khalid",
                        url: "https://www.youtube.com/watch?v=V1Pl8CzNzCw",
                        thumbnail: "https://i.ytimg.com/vi/V1Pl8CzNzCw/mqdefault.jpg"
                    },
                    {
                        title: "when the party's over",
                        artist: "Billie Eilish",
                        url: "https://www.youtube.com/watch?v=pbMwTqkKSps",
                        thumbnail: "https://i.ytimg.com/vi/pbMwTqkKSps/mqdefault.jpg"
                    }
                ],
                'angry': [
                    {
                        title: "Bad Guy",
                        artist: "Billie Eilish",
                        url: "https://www.youtube.com/watch?v=DyDfgMOUjCI",
                        thumbnail: "https://i.ytimg.com/vi/DyDfgMOUjCI/mqdefault.jpg"
                    },
                    {
                        title: "Break My Heart",
                        artist: "Dua Lipa",
                        url: "https://www.youtube.com/watch?v=Nj2U6rhnucI",
                        thumbnail: "https://i.ytimg.com/vi/Nj2U6rhnucI/mqdefault.jpg"
                    },
                    {
                        title: "Circles",
                        artist: "Post Malone",
                        url: "https://www.youtube.com/watch?v=wXhTHyIgQ_U",
                        thumbnail: "https://i.ytimg.com/vi/wXhTHyIgQ_U/mqdefault.jpg"
                    }
                ],
                'neutral': [
                    {
                        title: "Stay",
                        artist: "Kid LAROI & Justin Bieber",
                        url: "https://www.youtube.com/watch?v=kTJczUoc26U",
                        thumbnail: "https://i.ytimg.com/vi/kTJczUoc26U/mqdefault.jpg"
                    },
                    {
                        title: "Shivers",
                        artist: "Ed Sheeran",
                        url: "https://www.youtube.com/watch?v=Il0S8BoucSA",
                        thumbnail: "https://i.ytimg.com/vi/Il0S8BoucSA/mqdefault.jpg"
                    },
                    {
                        title: "As It Was",
                        artist: "Harry Styles",
                        url: "https://www.youtube.com/watch?v=H5v3kku4y6Q",
                        thumbnail: "https://i.ytimg.com/vi/H5v3kku4y6Q/mqdefault.jpg"
                    }
                ]
            };

            const recommendations = moodRecommendations[mood.toLowerCase()] || moodRecommendations['happy'];
            
            const songsHTML = recommendations.map(song => `
                <div class="youtube-song-item" style="margin: 10px 0; padding: 10px; border: 1px solid #444; border-radius: 8px; background: rgba(255,255,255,0.05);">
                    <a href="${song.url}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                        <img src="${song.thumbnail}" alt="${song.title}" style="width: 120px; height: 90px; border-radius: 4px; object-fit: cover;">
                        <div>
                            <div style="font-weight: 500; color: #ff0000;">${song.title}</div>
                            <div style="font-size: 12px; color: #888;">${song.artist}</div>
                        </div>
                    </a>
                </div>
            `).join('');

            container.innerHTML = `
                <h4 style="color: #ff0000; margin-bottom: 10px;">🎵 YouTube Music Recommendations:</h4>
                ${songsHTML}
                <p style="color: #888; font-size: 12px; margin-top: 10px;">
                    💡 These are popular songs from YouTube Music for your mood. Click any song to listen!
                </p>
            `;
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
            
            // Show music platform buttons instead of automatic recommendations
            showMusicPlatformButtons(mood);
        }

        // Renamed and refactored function to render dashboard charts
        async function renderDashboardCharts() {
            showScreen(moodHistoryDashboardScreen); // Use the correct screen
            const historyMessage = document.getElementById('history-message');
            const historyChartCanvas = document.getElementById('moodHistoryChart');

            historyMessage.textContent = ''; // Clear previous messages
            if (chartInstance) {
                chartInstance.destroy(); // Clear previous chart instance
                chartInstance = null;
            }

            if (!latestScanData) {
                historyMessage.textContent = "No recent scan data available. Please perform a mood scan first.";
                historyChartCanvas.style.display = 'none';
                return;
            }

            historyChartCanvas.style.display = 'block';

            const { percentages } = latestScanData;
            const labels = Object.keys(percentages);
            const data = Object.values(percentages);

            // Get accent color from CSS variables for dynamic theming
            const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

            chartInstance = new Chart(historyChartCanvas, {
                type: 'radar',
                data: {
                    labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
                    datasets: [{
                        label: 'Emotional Profile',
                        data: data,
                        backgroundColor: `${accentColor}33`, // Accent color with 20% opacity
                        borderColor: accentColor,
                        borderWidth: 2,
                        pointBackgroundColor: accentColor,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-text-color')
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (context.parsed.r !== null) {
                                        label += `: ${(context.parsed.r * 100).toFixed(1)}%`;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            angleLines: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                            },
                            grid: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--border-color')
                            },
                            pointLabels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--primary-text-color'),
                                font: {
                                    size: 12
                                }
                            },
                            ticks: {
                                backdropColor: 'transparent',
                                color: getComputedStyle(document.documentElement).getPropertyValue('--secondary-text-color'),
                                stepSize: 0.2,
                                callback: value => `${(value * 100)}%`
                            },
                            suggestedMin: 0,
                            suggestedMax: 1
                        }
                    }
                }
            });
        }

        // Auth form switching functionality
        switchToRegisterBtn?.addEventListener('click', () => {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        });

        switchToLoginBtn?.addEventListener('click', () => {
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        });

        // Add event listener for the new Back to Home button in the support screen
        const supportBackBtn = projectSupportScreen.querySelector('.back-button');
        if (supportBackBtn) {
            supportBackBtn.addEventListener('click', function() {
                showScreen(homeScreen);
            });
        }

        // Function to show music platform buttons
        function showMusicPlatformButtons(mood) {
            musicRecommendationsDiv.innerHTML = `
                <h4 style="color: #a7ffeb; margin-bottom: 20px;">🎵 Choose Your Music Platform:</h4>
                <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="getSpotifyRecommendations('${mood}')" class="music-platform-btn" style="
                        display: flex; 
                        align-items: center; 
                        gap: 10px; 
                        padding: 15px 25px; 
                        background: linear-gradient(45deg, #1DB954, #1ed760); 
                        color: white; 
                        border: none; 
                        border-radius: 25px; 
                        font-size: 16px; 
                        font-weight: 600; 
                        cursor: pointer; 
                        transition: transform 0.2s, box-shadow 0.2s;
                        box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Spotify
                    </button>
                    <button onclick="getYouTubeMusicRecommendations('${mood}')" class="music-platform-btn" style="
                        display: flex; 
                        align-items: center; 
                        gap: 10px; 
                        padding: 15px 25px; 
                        background: linear-gradient(45deg, #FF0000, #ff4444); 
                        color: white; 
                        border: none; 
                        border-radius: 25px; 
                        font-size: 16px; 
                        font-weight: 600; 
                        cursor: pointer; 
                        transition: transform 0.2s, box-shadow 0.2s;
                        box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        YouTube Music
                    </button>
                </div>
                <div id="spotify-recommendations" style="margin-top: 20px;"></div>
                <div id="youtube-recommendations" style="margin-top: 20px;"></div>
            `;
        }

        // Function to get Spotify recommendations when button is clicked
        async function getSpotifyRecommendations(mood) {
            const spotifyDiv = document.getElementById('spotify-recommendations');
            if (!spotifyDiv) return;
            
            spotifyDiv.innerHTML = '<p style="color: #a7ffeb;">Loading Spotify recommendations...</p>';
            
            try {
                const response = await fetch(config.apiUrl(`/api/get-music?mood=${encodeURIComponent(mood)}`));
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Clear the recommendations div
                spotifyDiv.innerHTML = '';
                
                // Display tracks if available
                if (data.tracks && data.tracks.length > 0) {
                    const tracksHTML = data.tracks.map(track => `
                        <div class="track-item" style="margin: 10px 0; padding: 10px; border: 1px solid #444; border-radius: 8px; background: rgba(255,255,255,0.05);">
                            <a href="${track.url}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                                <img src="${track.imageUrl}" alt="${track.name}" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;">
                                <div>
                                    <div style="font-weight: 500; color: #1DB954;">${track.name}</div>
                                    <div style="font-size: 12px; color: #888;">${track.artist}</div>
                                </div>
                            </a>
                        </div>
                    `).join('');
                    
                    spotifyDiv.innerHTML += `
                        <h4 style="color: #1DB954; margin-bottom: 10px;">🎵 Spotify Recommendations:</h4>
                        ${tracksHTML}
                    `;
                }
                
                // Display playlists if available
                if (data.playlists && data.playlists.length > 0) {
                    const playlistsHTML = data.playlists.map(playlist => {
                        // Extract playlist ID from URL
                        const playlistId = playlist.url.split('/playlist/')[1]?.split('?')[0];
                        return `
                            <div class="playlist-item" style="margin: 10px 0; padding: 10px; border: 1px solid #444; border-radius: 8px; background: rgba(255,255,255,0.05);">
                                <a href="${playlist.url}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                                    <img src="${playlist.imageUrl}" alt="${playlist.name}" style="width: 60px; height: 60px; border-radius: 4px; object-fit: cover;">
                                    <span style="font-weight: 500; color: #1DB954;">${playlist.name}</span>
                                </a>
                                ${playlistId ? `<button onclick="getPlaylistTracks('${playlistId}', '${playlist.name}')" style="margin-left: auto; padding: 5px 10px; background: #1DB954; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">View Tracks</button>` : ''}
                            </div>
                        `;
                    }).join('');
                    
                    spotifyDiv.innerHTML += `
                        <h4 style="color: #1DB954; margin: 20px 0 10px 0;">📋 Spotify Playlists:</h4>
                        ${playlistsHTML}
                        <div id="trackList" style="margin-top: 15px;"></div>
                    `;
                }
                
                // Show message if no recommendations available
                if ((!data.tracks || data.tracks.length === 0) && (!data.playlists || data.playlists.length === 0)) {
                    spotifyDiv.innerHTML = '<p style="color: #888;">No Spotify recommendations available for this mood.</p>';
                }
            } catch (error) {
                console.error('Error fetching Spotify recommendations:', error);
                spotifyDiv.innerHTML = '<p style="color: #ff8a80;">Unable to load Spotify recommendations.</p>';
            }
        }
    }

    // Start waiting for Firebase
    waitForFirebase();
});