require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
var session = require('express-session');
const { OpenAI } = require('openai');
const { generateCreativePrompt, generateRhythmoji } = require('./controllers/openaiController');
const port = process.env.PORT || 3000;




// Configure the Express application
const app = express();

app.use(cors());

app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to extract json data from POST requests
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Create route for handling POST requests to '/openai/response'
app.post('/openai/response', generateCreativePrompt);

// Your application's client credentials
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIPY_CLIENT_ID,
  clientSecret: process.env.SPOTIPY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIPY_REDIRECT_URI
});

// Serve the main HTML page at the root
app.get('/', (req, res) => {
    // Check if user session has an authenticated state
    if (req.session && req.session.isAuthenticated) {
        res.sendFile('index.html', { root: __dirname });
    } else {
        // If not authenticated, redirect to login
        res.redirect('/login');
    }
});

// Routes
app.get('/login', (req, res) => {
  var scopes = ['user-top-read'],
      state = generateRandomString(16);
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error logging out');
    }
    // Inform user to manually log out from Spotify
    res.send(`<p>Please logout from <a href="https://www.spotify.com/account/overview/" target="_blank" rel="noopener noreferrer">here</a> if you wish to end all sessions.</p>`);
  });
});

app.post('/submit-artists', async (req, res) => {
  try {
    // Example artist data structure, adjust based on actual form input
    const artists = [{name: req.body.artist1}, {name: req.body.artist2}, {name: req.body.artist3}];
    const genres = []; // Logic to determine genres based on artists if applicable

    // Simulate a request object for generateCreativePrompt
    const reqSimulated = { body: { artists: artists, genres: genres } };

    const creativeDescription = await generateCreativePrompt(reqSimulated);
    const imagePath = await generateRhythmoji(creativeDescription);

    // Assuming imagePath is a local server path to the image, you might need to convert it to a URL or serve it statically
    // For example, if images are served from the '/public/images' directory
    const imageUrl = `${imagePath}`;

    // Redirect to the displayImage.html with the image and description
    // Ensure encodeURIComponent is used to safely encode the description in the URL
    res.redirect(`/displayImage.html?img=${encodeURIComponent(imageUrl)}&desc=${encodeURIComponent(creativeDescription)}`);
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).send("Failed to generate image.");
  }
});


app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi.authorizationCodeGrant(code).then(data => {
    const accessToken = data.body['access_token'];
    const refreshToken = data.body['refresh_token'];

    spotifyApi.setAccessToken(accessToken);

    req.session.refreshToken = refreshToken;

    // Fetch the top genres
    spotifyApi.getMyTopArtists({time_range: 'short_term'}).then(data => {
        let topArtists = data.body.items;
        let genres = topArtists.flatMap(artist => artist.genres);
        let topGenres = getTopItems(genres, 10);

        req.session.topArtists = topArtists;
        req.session.topGenres = topGenres;
        req.session.isAuthenticated = true; // Set session as authenticated
        res.redirect('/display');
        
    }).catch(error => {
        console.error('Error getting top artists:', error);
        res.redirect('/error.html');
    });

  }).catch(error => {
    console.error('Error getting access token:', error);
    res.send(`Error getting access token: ${error}`);
  });
});

app.get('/display', async (req, res) => {
  try {
      if (!req.session.accessToken || new Date(req.session.accessTokenExpiration) <= new Date()) {
          await refreshAccessToken(req.session);
      }

      spotifyApi.setAccessToken(req.session.accessToken);

      const genres = req.session.topGenres;
      const artists = req.session.topArtists;
      console.log(genres);
      if (!genres || !Array.isArray(genres)) {
          return res.status(400).send("Genres must be provided as an array.");
      }

      // Ensure the structure matches what generateCreativePrompt expects
      req.body = { genres: genres, artists: artists };

      const creativeDescription = await generateCreativePrompt(req);
      const imageUrl = await generateRhythmoji(creativeDescription);
       
      // Encode the GPT-4 output to include in the URL
      const encodedDescription = encodeURIComponent(creativeDescription);
      let genreParams = genres.map(genre => `genres[]=${encodeURIComponent(genre.genre)}`).join('&');

      // Before redirecting, set cache-control headers to prevent caching
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

      // Redirect to the displayImage.html with both the image URL and the GPT-4 output
      res.redirect(`/displayImage.html?img=${encodeURIComponent(imageUrl)}&${genreParams}&desc=${encodedDescription}`);
  } catch (error) {
      console.error("Error in /display route:", error);
      res.status(500).send("An error occurred while processing your request.");
  }
});


function refreshAccessToken(session) {
  spotifyApi.setRefreshToken(session.refreshToken);
  return spotifyApi.refreshAccessToken().then(data => {
    session.accessToken = data.body['access_token'];
    spotifyApi.setAccessToken(session.accessToken);
    return data.body['access_token'];
  }).catch(error => {
    console.error('Error refreshing access token:', error);
  });
}


// Helper function to get top items by count
function getTopItems(items, limit) {
  let counts = items.reduce((acc, value) => ({ ...acc, [value]: (acc[value] || 0) + 1 }), {});
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, limit).map(key => ({ genre: key, count: counts[key] }));
}

function generateRandomString(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Start the Express server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});