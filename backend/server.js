console.log('SERVER V3 - Spotify defensive code is running');

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SpotifyWebApi from 'spotify-web-api-node';
const webpush = require('web-push');
const { Firestore } = require('@google-cloud/firestore');
const admin = require('firebase-admin');

// Initialize GoogleGenerativeAI
console.log('Is API Key loaded:', !!process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const port = 8000;

// Initialize Firestore
const firestore = new Firestore();

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://moodscanai.netlify.app' // Your live frontend URL
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// Set up multer for in-memory image storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Converts a ReadableStream to a Buffer.
async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Function to analyze image with Gemini
async function analyzeImageWithGemini(imageBuffer) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = "Analyze the primary emotion of the person in this image. Choose only from this list: Happy, Sad, Angry, Surprised, Neutral. Respond with only the single word for the emotion.";
  
  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: "image/jpeg", // or "image/png"
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  const text = response.text();
  return text.trim();
}

// Function to get wellness advice
async function getWellnessAdvice(emotion) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `The user is feeling ${emotion}. Provide a short, actionable, and empathetic wellness tip in 2-3 sentences.`;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return text;
}

// Helper function to convert buffer to Gemini-compatible format
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

// Configure web-push with VAPID keys
// Make sure to set these in your environment variables
const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
};
webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Middleware to verify Firebase ID token (optional)
async function softVerifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedToken; // Attach user to request if token is valid
        } catch (error) {
            console.warn('Received an invalid or expired Firebase token.');
            // Do not block the request, just proceed without a user object
        }
    }
    next();
}

// Middleware to verify Firebase ID token (strict)
async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Received an invalid or missing Firebase token.');
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid Firebase token.' });
    }
    next();
}

// API endpoint to analyze mood, now with streak logic
app.post('/api/analyze-mood', upload.single('image'), softVerifyFirebaseToken, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded.' });
    }

    try {
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype,
            },
        };
        const prompt = "Analyze the primary emotion conveyed by the facial expression in this image. The possible emotions are: Happy, Sad, Angry, Surprised, Neutral, Fearful, Disgusted, Confused, Tired. Respond ONLY with a JSON object containing two keys: 'mood' (a string with the detected primary emotion, starting with a capital letter) and 'percentages' (an object where keys are all possible emotion strings and values are the confidence scores as decimals from 0 to 1).";
        
        const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = gemini.getGenerativeModel({ model: "gemini-pro-vision" });
        const result = await model.generateContent([prompt, imagePart]);
        const geminiResponseText = result.response.text();
        const analysis = JSON.parse(geminiResponseText);

        let responseData = { ...analysis, currentStreak: 0 };

        // --- Streak Logic (only for logged-in users) ---
        if (req.user) {
            const userId = req.user.uid;
            const userRef = firestore.collection('users').doc(userId);
            const userDoc = await userRef.get();
            const userData = userDoc.data() || {};
            
            let currentStreak = userData.currentStreak || 0;
            const lastScanTimestamp = userData.lastScanTimestamp;

            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            if (lastScanTimestamp) {
                const lastScanDate = new Date(lastScanTimestamp.toMillis());
                lastScanDate.setHours(0, 0, 0, 0); // Start of the last scan day

                const diffTime = today.getTime() - lastScanDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (diffDays === 1) {
                    // Scanned yesterday, continue streak
                    currentStreak++;
                } else if (diffDays > 1) {
                    // Scanned before yesterday, reset streak
                    currentStreak = 1;
                }
                // If diffDays is 0, a scan already happened today, so do nothing.
            } else {
                // First scan for this user
                currentStreak = 1;
            }

            // Update user document
            await userRef.set({
                currentStreak: currentStreak,
                lastScanTimestamp: new Date()
            }, { merge: true });

            responseData.currentStreak = currentStreak;
        }

        res.json(responseData);
    } catch (error) {
        console.error('Error in /api/analyze-mood:', error);
        res.status(500).json({ error: 'Failed to analyze mood.', details: error.message });
    }
});

// API endpoint for mood-based advice
app.get('/api/get-advice', async (req, res) => {
  const { mood } = req.query;

  if (!mood) {
    return res.status(400).json({ error: 'Mood query parameter is required.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `A user is feeling ${mood}. Provide a short, actionable, and empathetic wellness tip in 2-3 sentences. Respond with a single JSON object with one key: "advice".`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n|```/g, '').trim();

    const adviceResult = JSON.parse(text);

    res.status(200).json(adviceResult);

  } catch (error) {
    console.error('Error getting mood advice:', error);
    res.status(500).json({ error: 'Failed to get mood advice.', details: error.message });
  }
});

// API endpoint for AI Psychologist Chat
app.post('/api/chat', async (req, res) => {
  console.log('Received request for /api/chat');
  try {
    const { message } = req.body;
    console.log('Message received:', message);

    if (!message) {
      console.log('Validation failed: Message is required.');
      return res.status(400).json({ error: 'Message is required.' });
    }

    console.log('Checking for Gemini API Key...');
    if (!process.env.GEMINI_API_KEY) {
        console.error('Gemini API Key is not configured.');
        return res.status(500).json({ error: 'Server configuration error: AI service is not available.' });
    }
    console.log('Gemini API Key found.');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Act as an empathetic AI psychologist. Respond helpfully and compassionately to the following user message: "${message}"`;

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Received response from Gemini.');

    res.json({ response: text });

  } catch (error) {
    console.error('Detailed AI Error in /api/chat:', error);
    res.status(500).json({ 
        error: "Failed to get a response from the AI psychologist.", 
        details: error.message 
    });
  }
});

// API endpoint for Spotify Music Recommendations
app.get('/api/get-music', async (req, res) => {
  const { mood } = req.query;

  if (!mood) {
    return res.status(400).json({ error: 'Mood query parameter is required.' });
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const moodMap = {
    'Happy': 'happy hits',
    'Sad': 'sad songs acoustic',
    'Angry': 'angry workout rock',
    'Neutral': 'chill focus',
    'Surprised': 'discover weekly',
    'Fearful': 'calm soothing',
    'Disgusted': 'clean fresh',
    'Confused': 'clear instrumental',
    'Tired': 'lullaby peaceful'
  };
  const searchQuery = moodMap[mood] || 'chill';

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    const playlistData = await spotifyApi.searchPlaylists(searchQuery, { limit: 5 });

    if (!playlistData.body.playlists || !playlistData.body.playlists.items.length) {
      return res.status(404).json({ error: 'No playlists found for this mood.' });
    }

    const items = playlistData.body.playlists.items;
    // Debug: Log items to help diagnose nulls in production
    console.log('Spotify playlist items:', items);
    // Prevent crash if Spotify returns null items or items is null, and only map playlists with a name
    const playlists = (items || [])
      .filter(playlist => playlist && playlist.name)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls.spotify,
        imageUrl: (playlist.images && playlist.images.length > 0) ? playlist.images[0].url : 'https://i.scdn.co/image/ab67616d0000b273821d6e34F4f36a545a452583'
      }));

    console.log(`Found ${playlists.length} playlists for the mood.`);
    res.status(200).json({ playlists });

  } catch (error) {
    console.error('Error fetching from Spotify:', error);
    res.status(500).json({ error: 'Failed to fetch music recommendations.', details: error.message });
  }
});

// New API endpoint to get tracks from a playlist
app.get('/api/get-playlist-tracks', async (req, res) => {
  const { playlistId } = req.query;

  if (!playlistId) {
    return res.status(400).json({ error: 'Playlist ID is required.' });
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);

    const tracksData = await spotifyApi.getPlaylistTracks(playlistId, { limit: 50 });

    if (!tracksData.body || !tracksData.body.items) {
      return res.status(404).json({ error: 'No tracks found in this playlist.' });
    }

    // Debug: Log the first item structure to understand the data format
    if (tracksData.body.items.length > 0) {
      console.log('First track item structure:', JSON.stringify(tracksData.body.items[0], null, 2));
    }

    // Prevent crash if Spotify returns null items or items is null
    const names = (tracksData.body.items || [])
      .filter(item => {
        // Handle different possible structures
        return item && (
          (item.track && item.track.name) || // Standard Spotify playlist track structure
          item.name // Direct track structure
        );
      })
      .map(item => {
        // Extract name from the appropriate location
        return item.track ? item.track.name : item.name;
      });

    console.log(`Found ${names.length} tracks in playlist.`);
    res.status(200).json({ 
      trackNames: names,
      totalTracks: names.length,
      debug: {
        totalItems: tracksData.body.items.length,
        firstItemStructure: tracksData.body.items[0] ? Object.keys(tracksData.body.items[0]) : null
      }
    });

  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    res.status(500).json({ error: 'Failed to fetch playlist tracks.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Generic endpoint for extracting track names from any Spotify tracks data
app.post('/api/extract-track-names', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.tracks || !data.tracks.items) {
      return res.status(400).json({ error: 'Invalid data structure. Expected data.tracks.items array.' });
    }

    // Prevent crash if Spotify returns null items
    const trackNames = (data.tracks.items || [])
      .filter(item => item && item.name)
      .map(item => item.name);

    console.log(`Extracted ${trackNames.length} track names from data.`);
    res.status(200).json({ 
      trackNames,
      totalTracks: trackNames.length,
      originalDataStructure: {
        totalItems: data.tracks.items.length,
        hasTracks: !!data.tracks,
        hasItems: !!data.tracks.items
      }
    });

  } catch (error) {
    console.error('Error extracting track names:', error);
    res.status(500).json({ error: 'Failed to extract track names.', details: error.message });
  }
});

// New endpoint to save a push subscription
app.post('/api/save-subscription', verifyFirebaseToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: No user is logged in.' });
    }

    const { subscription } = req.body;
    if (!subscription) {
        return res.status(400).json({ message: 'Bad Request: No subscription object provided.' });
    }

    try {
        const userId = req.user.uid;
        await firestore.collection('users').doc(userId).set({
            pushSubscription: subscription
        }, { merge: true });

        console.log(`Subscription saved for user: ${userId}`);
        res.status(200).json({ message: 'Subscription saved successfully.' });
    } catch (error) {
        console.error('Error saving subscription to Firestore:', error);
        res.status(500).json({ message: 'Internal Server Error: Could not save subscription.' });
    }
});

// New endpoint to send a test push notification
app.post('/api/send-test-notification', async (req, res) => {
    // NOTE: For a real app, this endpoint should be protected, e.g., only callable by an admin.
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'Bad Request: No userId provided.' });
    }

    try {
        const userDoc = await firestore.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const { pushSubscription } = userDoc.data();

        if (!pushSubscription) {
            return res.status(404).json({ message: 'No push subscription found for this user.' });
        }

        const payload = JSON.stringify({
            title: 'Hello from MoodScan AI!',
            body: 'This is your test notification!'
        });

        await webpush.sendNotification(pushSubscription, payload);

        console.log(`Test notification sent successfully to user: ${userId}`);
        res.status(200).json({ message: 'Test notification sent successfully.' });

    } catch (error) {
        // Handle common errors, like an expired subscription
        if (error.statusCode === 410) {
            console.log(`Subscription for user ${userId} has expired. Removing from DB.`);
            // Clean up the invalid subscription from the database
            await firestore.collection('users').doc(userId).update({ pushSubscription: null });
            return res.status(410).json({ message: 'Subscription has expired and was removed.' });
        }
        console.error(`Error sending notification to user ${userId}:`, error);
        res.status(500).json({ message: 'Internal Server Error: Could not send notification.' });
    }
}); 