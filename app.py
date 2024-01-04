@app.route('/get_top_genres')
def get_top_genres():
    try:
        # Ensure there's a valid session with token information
        token_info = session.get('token_info', None)
        if not token_info:
            raise Exception("User not logged in")
        
        # Authenticate with Spotify using the access token
        sp = spotipy.Spotify(auth=token_info['access_token'])

        # Fetch the top artists and extract genres
        top_artists = sp.current_user_top_artists(limit=50, time_range='medium_term')['items']
        genres = [genre for artist in top_artists for genre in artist['genres']]
        
        # Count and get the top 10 genres
        genre_counts = Counter(genres)
        top_genres = genre_counts.most_common(10)

        # Render the top genres in a template
        return render_template('top_genres.html', top_genres=top_genres)
    except Exception as e:
        # Handle exceptions and redirect to the home page or a suitable error page
        print(f"An exception occurred: {str(e)}")
        return redirect('/')
