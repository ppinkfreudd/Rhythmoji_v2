// app.js
require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const session = require('express-session');
const { OpenAI } = require('openai');
const { generateCreativePrompt, generateRhythmoji } = require('./controllers/openaiController');
const port = process.env.PORT || 3000;
// Configure the Express application
const app = express();

app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to extract json data from POST requests
app.use(express.json());
app.use(express.static(__dirname));


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
    res.sendFile('index.html', { root: __dirname });
  });
  
// Routes
app.get('/login', (req, res) => {
  var scopes = ['user-top-read'],
      state = generateRandomString(16);
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
  res.redirect(authorizeURL);
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

    spotifyApi.setAccessToken(accessToken);

    // Fetch the top genres
    spotifyApi.getMyTopArtists().then(data => {
        let topArtists = data.body.items;
        let genres = topArtists.flatMap(artist => artist.genres);
        let topGenres = getTopItems(genres, 10);

        req.session.topArtists = topArtists;
        req.session.topGenres = topGenres;
        res.redirect('/display');
        
    }).catch(error => {
        console.error('Error getting top artists:', error);
        res.send(`Error getting top artists: ${error}`);
    });

  }).catch(error => {
    console.error('Error getting access token:', error);
    res.send(`Error getting access token: ${error}`);
  });
});


app.get('/display', async (req, res) => {
    try {
        const genres = req.session.topGenres;
        const artists = req.session.topArtists;

        if (!genres || !Array.isArray(genres)) {
            return res.status(400).send("Genres must be provided as an array.");
        }

        // Ensure the structure matches what generateCreativePrompt expects
        req.body = { genres: genres, artists: artists };


        const creativeDescription = await generateCreativePrompt(req);
        const imageUrl = await generateRhythmoji(creativeDescription);
        
        let genreParams = genres.map(genre => `genres[]=${encodeURIComponent(genre.genre)}`).join('&');
        res.redirect(`/displayImage.html?img=${encodeURIComponent(imageUrl)}&${genreParams}`);
    } catch (error) {
        console.error("Error in /display route:", error);
        res.status(500).send("An error occurred while processing your request.");
    }
});


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