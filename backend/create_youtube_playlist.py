from ytmusicapi import YTMusic

# --- Configuration ---
# THIS IS THE KEY CHANGE: Use real, searchable songs.
MOOD = "Happy"
SONGS_FOR_MOOD = [
    "Pharrell Williams - Happy",
    "Katrina & The Waves - Walking on Sunshine", 
    "Lizzo - Good As Hell",
    "Justin Timberlake - Can't Stop The Feeling!",
    "Mark Ronson - Uptown Funk ft. Bruno Mars",
    "The Weeknd - Blinding Lights",
    "Dua Lipa - Levitating",
    "Post Malone - Sunflower ft. Swae Lee",
    "Maroon 5 - Sugar",
    "Ed Sheeran - Shape of You",
    # Let's add a fake one to show how the code handles it
    "Non-Existent Upbeat Song 123"
]
# --- End Configuration ---

def integrate_with_youtube_music():
    """
    Connects to YouTube Music, creates a playlist, and adds songs.
    This function requires a one-time setup to generate 'oauth.json'.
    """
    try:
        print("Initializing connection to YouTube Music...")
        # The 'oauth.json' file is needed for authentication.
        # If it doesn't exist, you'll be prompted to create it.
        ytmusic = YTMusic('oauth.json')
        print("✅ Connection successful.")

        # 1. Search for songs and log the result for each one
        print(f"\nSearching for songs for a '{MOOD}' mood...")
        found_video_ids = []
        
        for song_title in SONGS_FOR_MOOD:
            try:
                search_results = ytmusic.search(song_title, filter="songs")
                if search_results and len(search_results) > 0:
                    video_id = search_results[0]['videoId']
                    found_video_ids.append(video_id)
                    # Log success for each song found
                    print(f"  ✔️ SUCCESS: Found '{song_title}'")
                else:
                    # Log failure for each song not found
                    print(f"  ❌ FAILED:  Could not find a result for '{song_title}'")
            except Exception as search_error:
                # Log error for individual song search
                print(f"  ⚠️  ERROR:   Failed to search for '{song_title}': {search_error}")

        # 2. IMPORTANT CHECK: Only proceed if we found at least one song
        if found_video_ids:
            playlist_name = f"{MOOD} Mood Mix ✨"
            print(f"\nFound {len(found_video_ids)} songs. Creating playlist: '{playlist_name}'")
            
            try:
                playlist_id = ytmusic.create_playlist(playlist_name, f"A curated {MOOD.lower()} mood playlist", "PRIVATE", found_video_ids)
                
                print("\n--- SUCCESS! ---")
                print("YouTube Music playlist created.")
                print(f"Playlist Name: {playlist_name}")
                print(f"Playlist ID: {playlist_id}")
                print(f"Songs Added: {len(found_video_ids)}")
                
            except Exception as playlist_error:
                print("\n--- PLAYLIST CREATION FAILED ---")
                print(f"Error creating playlist: {playlist_error}")
                print("The songs were found but the playlist could not be created.")

        else:
            # If no songs were found at all
            print("\n--- ACTION FAILED ---")
            print("Could not find any of the recommended songs on YouTube Music.")
            print("Please check if the song titles are correct and searchable.")
            print("This could be due to:")
            print("  - Regional restrictions")
            print("  - Copyright issues")
            print("  - Incorrect song titles")
            print("  - Network connectivity issues")

    except FileNotFoundError:
        print("\n--- AUTHENTICATION ERROR ---")
        print("The 'oauth.json' file was not found.")
        print("Please run the authentication setup first:")
        print("  python3 run_oauth.py")
        print("Or follow the manual setup instructions in the documentation.")
        
    except Exception as error:
        print("\n--- CRITICAL ERROR ---")
        print(f"An error occurred during integration: {error}")
        print("\nThis could be an authentication issue. Make sure you are logged into YouTube Music in your browser.")
        print("If the problem persists, try:")
        print("  1. Re-authenticating with: python3 run_oauth.py")
        print("  2. Checking your internet connection")
        print("  3. Verifying you're logged into YouTube Music in your browser")

if __name__ == "__main__":
    integrate_with_youtube_music() 