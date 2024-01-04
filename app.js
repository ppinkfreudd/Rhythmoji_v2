// app.js
require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const { generateCreativePrompt } = require('./controllers/openaiController');  // Import the function

// Configure the Express application
const app = express();

// Middleware to extract json data from POST requests
app.use(express.json());
app.use(express.static('public'));

// Create route for handling POST requests to '/openai/response'
app.post('/openai/response', generateCreativePrompt);  // Fixed the handler function here

// Your application's client credentials
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIPY_CLIENT_ID,
  clientSecret: process.env.SPOTIPY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIPY_REDIRECT_URI
});


app.get('/display', generateCreativePrompt);

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
      let topGenres = getTopItems(genres, 10); // Implement this function based on your needs

      // Send the top genres as response
      res.send(topGenres);
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
    // Simulate a request body with genre data
    req.body.genres = [
        { genre: "rap", count: 5 },
        { genre: "pop", count: 3 },
        { genre: "jazz", count: 2 }
    ];
  
    // Then call the middleware manually (not typical usage, just for simulation)
    await generateCreativePrompt(req, res);
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
const port = process.env.PORT || 3000;
app.listen(port, () => {  // Removed the duplicate app.listen
  console.log(`App listening at http://localhost:${port}`);
});
