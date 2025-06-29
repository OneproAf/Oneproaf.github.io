from ytmusicapi import YTMusic

# --- You can customize these values ---
PLAYLIST_NAME = "My App's Recommendations"
SONGS_TO_ADD = [
    "Feel Good Inc by Gorillaz",
    "Yesterday by The Beatles",
    "Bohemian Rhapsody by Queen"
]
# --- End of customization ---

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

        # 1. Search for the songs to get their IDs
        print("\nSearching for song IDs...")
        video_ids = []
        for song_title in SONGS_TO_ADD:
            search_results = ytmusic.search(song_title, filter="songs")
            if search_results:
                video_id = search_results[0]['videoId']
                video_ids.append(video_id)
                print(f"  ✔️ Found '{song_title}'")
            else:
                print(f"  ❌ Could not find '{song_title}'")

        # 2. Create the playlist and add the songs
        if video_ids:
            print(f"\nCreating new playlist: '{PLAYLIST_NAME}'")
            
            playlist_id = ytmusic.create_playlist(PLAYLIST_NAME, "A new playlist from my app.", "PRIVATE", video_ids)
            
            print("\n--- SUCCESS! ---")
            print("Integration was successful.")
            print(f"A new playlist named '{PLAYLIST_NAME}' has been created in your YouTube Music library.")
            print(f"Playlist ID: {playlist_id}")
        else:
            print("\nNo songs were found, so no playlist was created.")

    except Exception as error:
        print("\n--- ERROR ---")
        print(f"An error occurred during integration: {error}")
        print("\nHave you run the setup for authentication?")
        print("If not, run 'ytmusicapi oauth' in your terminal and follow the instructions.")

if __name__ == "__main__":
    integrate_with_youtube_music() 