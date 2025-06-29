// Filename: create_youtube_playlist.cjs

const { searchMusics } = require('node-youtube-music');

// --- You can customize these values ---
const PLAYLIST_NAME = "My App's Recommendations";
const SONGS_TO_ADD = [
    "Feel Good Inc by Gorillaz",
    "Yesterday by The Beatles",
    "Bohemian Rhapsody by Queen"
];
// --- End of customization ---

/**
 * The main function to connect to YouTube Music, create a playlist, and add songs.
 */
async function searchForSongs() {
    try {
        console.log("\nSearching for song IDs...");
        for (const songTitle of SONGS_TO_ADD) {
            const searchResults = await searchMusics(songTitle);
            if (searchResults && searchResults.length > 0) {
                // Get the ID from the first search result
                const videoId = searchResults[0].youtubeId;
                console.log(`  ✔️ Found '${songTitle}' with ID: ${videoId}`);
            } else {
                console.log(`  ❌ Could not find '${songTitle}'`);
            }
        }

    } catch (error) {
        console.error("\n--- ERROR ---");
        console.error("An error occurred during search:", error.message);
    }
}

// Run the main integration function
searchForSongs(); 