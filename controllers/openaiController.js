const { OpenAI } = require('openai');
const { exec } = require('child_process');
require('dotenv').config();


const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

const generateCreativePrompt = async (req) => { // Removed res, as we are returning the value instead of sending response
    console.log("Received body:", req.body);
    const genreObjects = req.body.genres;

    if (!Array.isArray(genreObjects)) {
        console.error("Genres is undefined or not an array");
        throw new Error("Invalid genres format. Expected an array of genre objects."); // Throwing error to be caught by caller
    }

    const genres = genreObjects.map(g => g.genre);
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

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                role: 'user',
                content: prompt, 
                },
            ],
        });

        const creativeDescription = response.choices?.[0]?.message?.content;

        if (!creativeDescription) {
            console.error("No creative description received from GPT-4");
            throw new Error("Failed to generate creative description"); // Throwing error to be caught by caller
        }

        console.log("GPT-4 Output:", creativeDescription);
        return creativeDescription; // Returning the creative description for further use

    } catch (error) {
        console.error("Error:", error);
        throw error; // Rethrowing the error to be caught by caller
    }
};

const generateRhythmoji = async (creativeDescription) => {
    try {
        const imageResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: `Show the front view of a single lego character using "${creativeDescription}". Include only the frontal orientation figure in the image. White background.`, 
            n: 1,
            size: '1024x1024',
        });

        // Capturing the URL from the response
        const imageUrl = imageResponse.data[0].url; // Ensure correct access based on actual response structure
        
        const pythonCommand = `python3 remove_bg.py "${imageUrl}"`;

        const newImageUrl = await new Promise((resolve, reject) => {
            exec(pythonCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    reject(error);
                }
                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                    reject(stderr);
                }
                resolve(stdout.trim());
            });
        });

        return newImageUrl; // This will return the URL to wherever the function was called

    } catch (error) {
        console.error("Error generating image:", error);
        // Handle error appropriately
        throw error; // or return a default value or error message
    }
};

module.exports = { generateCreativePrompt, generateRhythmoji };