console.log('SERVER V3 - Spotify defensive code is running');

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import SpotifyWebApi from 'spotify-web-api-node';
import webpush from 'web-push';
import { Firestore } from '@google-cloud/firestore';
import admin from 'firebase-admin';
import axios from 'axios';

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
  'https://moodscanai.netlify.app'
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

// Only set up VAPID if both keys are provided and valid
if (vapidKeys.publicKey && vapidKeys.privateKey && 
    vapidKeys.publicKey !== 'test' && vapidKeys.privateKey !== 'test') {
    try {
        webpush.setVapidDetails(
            'mailto:your-email@example.com', // Replace with your email
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        console.log('VAPID keys configured successfully');
    } catch (error) {
        console.warn('Invalid VAPID keys, push notifications will be disabled:', error.message);
    }
} else {
    console.log('VAPID keys not configured, push notifications will be disabled');
}

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
app.post('/api/analyze-mood', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  try {
    const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = "Analyze the primary human emotion in this image. Choose only from this list: Happy, Sad, Angry, Surprised, Neutral, Fearful, Disgusted, Confused, Tired. Return only a single, valid JSON object with two keys: a 'mood' key with the dominant emotion as a string, and a 'percentages' key containing all detected expressions and their confidence scores from 0 to 1.";
    
    const imagePart = fileToGenerativePart(req.file.buffer, req.file.mimetype);

    const result = await visionModel.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // Clean up potential markdown formatting from the AI's response
    const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonResponse = JSON.parse(cleanedJsonString);

    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Detailed AI Error in /analyze-mood:', error);
    res.status(500).json({
      error: "Internal server error during mood analysis.",
      details: error.message
    });
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
    'Happy': 'happy upbeat',
    'Sad': 'sad acoustic',
    'Angry': 'angry rock',
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

    // Search for tracks (5 tracks)
    const tracksData = await spotifyApi.searchTracks(searchQuery, { limit: 5 });
    
    // Search for playlists (2 playlists)
    const playlistsData = await spotifyApi.searchPlaylists(searchQuery, { limit: 2 });

    // Process tracks
    const tracks = (tracksData.body.tracks?.items || [])
      .filter(track => track && track.name)
      .map(track => ({
        name: track.name,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        url: track.external_urls?.spotify || '#',
        imageUrl: (track.album?.images && track.album.images.length > 0) 
          ? track.album.images[0].url 
          : 'https://i.scdn.co/image/ab67616d0000b273821d6e34F4f36a545a452583'
      }));

    // Process playlists
    const playlists = (playlistsData.body.playlists?.items || [])
      .filter(playlist => playlist && playlist.name)
      .map(playlist => ({
        name: playlist.name,
        url: playlist.external_urls?.spotify || '#',
        imageUrl: (playlist.images && playlist.images.length > 0) 
          ? playlist.images[0].url 
          : 'https://i.scdn.co/image/ab67616d0000b273821d6e34F4f36a545a452583'
      }));

    console.log(`Found ${tracks.length} tracks and ${playlists.length} playlists for mood: ${mood}`);
    
    res.status(200).json({ 
      tracks: tracks.slice(0, 5), // Ensure exactly 5 tracks
      playlists: playlists.slice(0, 2) // Ensure exactly 2 playlists
    });

  } catch (error) {
    console.error('Error fetching from Spotify:', error);
    res.status(500).json({ error: 'Failed to fetch music recommendations.', details: error.message });
  }
});

// API endpoint for YouTube Music Recommendations (Premium feature)
app.get('/api/get-youtube-music', async (req, res) => {
  const { mood } = req.query;

  if (!mood) {
    return res.status(400).json({ error: 'Mood query parameter is required.' });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured, returning empty results');
    return res.status(200).json({ playlists: [] });
  }

  const moodMap = {
    'Happy': 'happy music playlist',
    'Sad': 'sad music playlist',
    'Angry': 'angry music playlist',
    'Neutral': 'chill music playlist',
    'Surprised': 'discovery music playlist',
    'Fearful': 'calm music playlist',
    'Disgusted': 'clean music playlist',
    'Confused': 'clear music playlist',
    'Tired': 'lullaby music playlist'
  };
  
  const searchQuery = moodMap[mood] || 'chill music playlist';

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'playlist',
        maxResults: 5,
        key: process.env.YOUTUBE_API_KEY
      }
    });

    if (!response.data || !response.data.items) {
      console.warn('No YouTube data received');
      return res.status(200).json({ playlists: [] });
    }

    const playlists = (response.data.items || [])
      .filter(item => item && item.snippet && item.id && item.id.playlistId)
      .map(item => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
        thumbnail: item.snippet.thumbnails?.medium?.url || 
                   item.snippet.thumbnails?.default?.url ||
                   'https://via.placeholder.com/120x90?text=No+Image',
        channelTitle: item.snippet.channelTitle || 'Unknown Channel'
      }));

    console.log(`Found ${playlists.length} YouTube playlists for mood: ${mood}`);
    
    res.status(200).json({ playlists: playlists.slice(0, 5) });

  } catch (error) {
    console.error('Error fetching from YouTube:', error);
    
    // Handle specific YouTube API errors
    if (error.response && error.response.status === 403) {
      return res.status(200).json({ 
        playlists: [],
        message: 'YouTube API quota exceeded or invalid key'
      });
    }
    
    res.status(200).json({ 
      playlists: [],
      message: 'Unable to fetch YouTube recommendations'
    });
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