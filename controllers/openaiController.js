const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

const generateCreativePrompt = async (req, res) => {
    console.log("Received body:", req.body);
    // Expecting req.body.genres to be an array of objects like [{genre: 'rap', count: 5}, ...]
    const genreObjects = req.body.genres;  // Now an array of objects

        if (!Array.isArray(genreObjects)) {
            // Handle the error appropriately
            console.error("Genres is undefined or not an array");
            return res.status(400).send("Invalid genres format. Expected an array of genre objects.");
        }
    // Extract just the genre names from each object
    const genres = genreObjects.map(g => g.genre);  // Now an array of genre names

    try {
        // Constructing a prompt that asks GPT-3 to generate creative descriptions based on genres
        let prompt = `Create a character description based on the following music genres: ${genres.join(", ")}. Using latest trends on the internet, match the genre data to the following categories, maintaining a healthy balance of artist-specific (i.e. a Nirvana band tee for Nirvana listeners) and genre-specific styles (e.g. Converse shoes for indie listeners):

        Head: the head must be that of a random animal
        Top: can be any type of shirt, jacket, or sweater
        Bottom: can be any type of shorts, jeans, leggings, skirt, etc.
        Shoes: can be any type of shoe
        Socks: can be any type of sock

        Ensure that the clothing and style reflect the vibrant and diverse nature of the genres.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                role: 'user',
                content: prompt, 
                },
            ],
        });

        // Log the GPT's output to the console
        console.log("GPT-4 Output:", response.choices[0].text);
        res.status(200).send(creativeDescription);  // Send back the response
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred");  // Send an error response
    }
};

module.exports = { generateCreativePrompt };
