document.addEventListener('DOMContentLoaded', () => {
    // Page sections
    const mainPage = document.getElementById('main-page');
    const scanPage = document.getElementById('scan-section');
    const psychologistPage = document.getElementById('ai-psychologist-screen');
    const appScreens = document.getElementById('app-screens');

    // Main page buttons
    const scanMoodBtn = document.getElementById('scanMoodBtn');
    const aiPsychologistBtn = document.getElementById('aiPsychologistBtn');
    
    // Scan page elements
    const video = document.getElementById('video');
    const overlayCanvas = document.getElementById('overlayCanvas');
    const captureMoodBtn = document.getElementById('captureMoodBtn');
    const imageUpload = document.getElementById('imageUpload');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const resultsDisplay = document.getElementById('results-display');
    const dominantMoodEl = document.getElementById('dominant-mood');
    const moodPercentageEl = document.getElementById('mood-percentage');
    const moodStatisticsEl = document.getElementById('mood-statistics');
    const adviceContainer = document.getElementById('advice-container');
    const musicContainer = document.getElementById('music-container');
    const psychologistRecommendationBtn = document.getElementById('psychologist-recommendation');
    const backToMainFromScanBtn = document.getElementById('back-to-main-from-scan');

    // Results page elements
    const resultsSection = document.getElementById('results-section');
    const dominantMoodResultEl = document.getElementById('dominant-mood-result');
    const moodPercentageResultEl = document.getElementById('mood-percentage-result');
    const moodStatisticsResultEl = document.getElementById('mood-statistics-result');
    const backButton = document.querySelector('#results-section .back-button');
    const backToHomeBtn2 = document.getElementById('backToHomeBtn2');

    // Psychologist chat elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('userInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const backToMainFromChatBtn = document.getElementById('back-to-main-from-chat');
    
    let stream;

    // --- Navigation ---
    function showPage(pageToShow) {
        mainPage.classList.add('hidden');
        appScreens.classList.add('hidden');
        psychologistPage.classList.add('hidden');
        
        if (pageToShow === scanPage || pageToShow === psychologistPage || pageToShow === resultsSection) {
            appScreens.classList.remove('hidden');
            // Hide all sections within app-screens first
            document.querySelectorAll('#app-screens > section').forEach(s => s.classList.add('hidden'));
            // Then show the target one
            pageToShow.classList.remove('hidden');
        } else {
             mainPage.classList.remove('hidden');
        }
    }

    scanMoodBtn.addEventListener('click', () => {
        showPage(scanPage);
        startCamera();
    });

    aiPsychologistBtn.addEventListener('click', () => {
        showPage(psychologistPage);
    });
    
    psychologistRecommendationBtn.addEventListener('click', () => {
       showPage(psychologistPage);
    });

    backToMainFromScanBtn.addEventListener('click', () => {
        showPage(mainPage);
        stopCamera();
    });

    backToMainFromChatBtn.addEventListener('click', () => {
        showPage(mainPage);
    });


    // --- Camera & Analysis ---
    async function startCamera() {
        if (stream) return;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
        } catch (err) {
            console.error("Error accessing the camera:", err);
            alert("Could not access the camera. Please ensure you have given permission.");
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
    }

    uploadImageBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            analyzeImage(file);
        }
    });

    captureMoodBtn.addEventListener('click', () => {
        overlayCanvas.width = video.videoWidth;
        overlayCanvas.height = video.videoHeight;
        overlayCanvas.getContext('2d').drawImage(video, 0, 0);
        overlayCanvas.toBlob(blob => {
            analyzeImage(blob);
        }, 'image/jpeg');
    });

    async function analyzeImage(imageData) {
        // Simple loading indicator
        document.body.style.cursor = 'wait';
        showPage(scanPage); // Ensure scan section is visible
        const loadingP = document.createElement('p');
        loadingP.textContent = 'Analyzing your mood...';
        scanPage.appendChild(loadingP);


        const formData = new FormData();
        formData.append('image', imageData, 'mood-image.jpg');

        try {
            const response = await fetch('https://oneproaf-github-io.onrender.com', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const result = await response.json();
            displayMoodResults(result); // Call the new display function
            showPage(resultsSection); // Show results page

        } catch (error) {
            console.error('Error analyzing image:', error);
            alert(`Analysis failed. Please try again. Error: ${error.message}`);
        } finally {
            document.body.style.cursor = 'default';
            loadingP.remove();
        }
    }
    
    // --- Display Results ---
    function displayMoodResults(analysis) {
        const { mood, percentages } = analysis;
        
        dominantMoodEl.textContent = mood;
        const confidence = (percentages[mood] || 1) * 100;
        moodPercentageEl.textContent = `${confidence.toFixed(1)}%`;

        moodStatisticsEl.innerHTML = ''; // Clear previous results
        
        for (const [emotion, score] of Object.entries(percentages)) {
            const row = document.createElement('div');
            row.className = 'mood-stat-row';

            const name = document.createElement('span');
            name.textContent = emotion;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'progress-bar-container';
            
            const bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.style.width = `${score * 100}%`;
            
            barContainer.appendChild(bar);
            row.appendChild(name);
            row.appendChild(barContainer);
            moodStatisticsEl.appendChild(row);
        }

        const psychologistBtn = document.getElementById('psychologist-recommendation');
        const badMoods = ["Sad", "Angry", "Fearful", "Disgusted"];
        if (badMoods.includes(mood)) {
            psychologistBtn.style.display = 'block';
        } else {
            psychologistBtn.style.display = 'none';
        }

        getMoodAdvice(mood);
        getMusicRecommendations(mood);
    }

    async function getMoodAdvice(mood) {
        const recommendationsEl = document.getElementById('recommendations');
        recommendationsEl.innerHTML = '<p>Loading advice...</p>';
        try {
            const response = await fetch(`https://oneproaf-github-io.onrender.com`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            recommendationsEl.innerHTML = `<h4>Wellness Tip:</h4><p>${data.advice}</p>`;
        } catch (error) {
            console.error('Error fetching advice:', error);
            recommendationsEl.innerHTML = '<p style="color: #ff9a9a;">Could not fetch advice at this time.</p>';
        }
    }

    async function getMusicRecommendations(mood) {
        const musicEl = document.getElementById('musicRecommendations');
        musicEl.innerHTML = '<h4>Music For You:</h4>';
        try {
            const response = await fetch(`https://oneproaf-github-io.onrender.com${mood}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const playlistContainer = document.createElement('div');
            playlistContainer.className = 'playlist-container';

            data.playlists.forEach(playlist => {
                const card = document.createElement('a');
                card.href = playlist.url;
                card.target = '_blank';
                card.className = 'playlist-card';

                const img = document.createElement('img');
                img.src = playlist.imageUrl;
                img.alt = `Cover for ${playlist.name}`;
                
                const name = document.createElement('span');
                name.textContent = playlist.name;

                card.appendChild(img);
                card.appendChild(name);
                playlistContainer.appendChild(card);
            });
            musicEl.appendChild(playlistContainer);

        } catch (error) {
            console.error('Error fetching music:', error);
            musicEl.innerHTML += '<p style="color: #ff9a9a;">Could not fetch music recommendations.</p>';
        }
    }


    // --- AI Psychologist Chat ---
    async function sendMessageToAI() {
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        addMessageToChat('user-message', userMessage);
        userInput.value = '';

        try {
            const response = await fetch('https://oneproaf-github-io.onrender.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.details || 'The AI is currently unavailable.');
            }

            const data = await response.json();
            addMessageToChat('ai-message', data.reply);

        } catch (error) {
            console.error('Error sending message to AI:', error);
            addMessageToChat('ai-message', `Sorry, I encountered an error: ${error.message}`);
        }
    }

    function addMessageToChat(className, text) {
        const p = document.createElement('p');
        p.className = className;
        p.textContent = text;
        chatContainer.appendChild(p);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    sendMessageBtn.addEventListener('click', sendMessageToAI);
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessageToAI();
        }
    });

    backButton.addEventListener('click', () => {
        showPage(scanPage);
        startCamera();
    });

    backToHomeBtn2.addEventListener('click', () => {
        showPage(mainPage);
        stopCamera();
    });
}); 
