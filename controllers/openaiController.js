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
        let prompt = `Using ${genres.join(", ")} and information from latest internet fashion trends, fill out the following template:

        Head: the head must be that of a random animal
        Top: can be any type of shirt, jacket, or sweater
        Bottom: can be any type of shorts, jeans, leggings, skirt, etc.
        Shoes: can be any type of shoe
        Socks: can be any type of sock

        Ensure that the clothing and style reflect the vibrant and diverse nature of the genres.
        
        Example: 
        Head: lion (this can be a random animal)
        Top: black metallica band tee (because they listen to metallica the most)
        Bottom: black leather pants (they love rock)
        Shoes: white converse
        Socks: white socks
        
        Remember to be specific but simple like above. You can mention specific artists, but not more than 1`;

        const response = await openai.chat.completions.create({
            model: 'text-davinci-003',
            messages: [
                {
                role: 'user',
                content: prompt, 
                },
            ],
        });

        const creativeDescription = response.choices?.[0]?.message?.content;  // Safely access the response data

        if (!creativeDescription) {
            // Handle the situation where the response doesn't have the expected structure
            console.error("No creative description received from GPT-4");
            return res.status(500).send("Failed to generate creative description");
        }

        console.log("GPT-4 Output:", creativeDescription);
        res.status(200).send(creativeDescription);  // Send back the creative description
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred");  // Send an error response
    }
};

module.exports = { generateCreativePrompt };
