const { OpenAI } = require('openai');
const { spawn } = require('child_process'); // Modified to use spawn from child_process
require('dotenv').config();
const fetch = require('node-fetch'); // To fetch image data
const fs = require('fs'); // For file system operations

const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});

const fetchWithTimeout = (url, options, timeout = 10000000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
        )
    ]);
};

const generateCreativePrompt = async (req) => { // Removed res, as we are returning the value instead of sending response
    //console.log("Received body:", req.body);
    const genreObjects = req.body.genres;
    const artistObjects = req.body.artists;
    //console.log(genreObjects);

    if (!Array.isArray(genreObjects)) {
        console.error("Genres is undefined or not an array");
        throw new Error("Invalid genres format. Expected an array of genre objects."); // Throwing error to be caught by caller
    }

    const genres = genreObjects.map(g => g.genre);
    const artists = artistObjects.slice(0, 5).map(a => a.name);

    console.log(artists);
    let prompt = `Optimize your answer for feeding into dall-e-3. Keep your response under 75 words. Using ${genres.join(", ")} and ${artists.join(", ")} and information from latest internet fashion trends (search for these) and your knowledge of good Dall-E prompts, fill out the following template. If you are to mention an artist, use a "-like" (e.g. Drake-like hoodie):

    Head: the head must be that of an animal (random and unrelated to the genre)
    Upper body: can be any type of shirt, jacket, or sweater or graphic tee (inspired by artist or genre)
    Lower body: can be any type of shorts, jeans, leggings, skirt, etc. (inspired only by genre (no artists can be mentioned for pants description))
    Shoes: can be any type of shoe (inspired by artist)
    Accessory: sunglasses, chain, hat, etc. (inspired by genre or artist)

    Ensure that the clothing and style reflect the vibrant and diverse nature of the genres,
    and that each item is a clear reflection of a genre, and their styles don't overlap.
    Don't explain your fashion choices in the output, just describe what it looks like
    
    Example: 
    Head: lion 
    Upper body: black metallica band graphic tee 
    Lower bodys: black leather pants
    Shoes: white converse
    Accessory: oversized sunglasses
    
    If you are going to mention a specific artist inspired design, describe the design instead of writing the artist's name and "-like" (for example, "Yeezy sweatshirt with GAP on it" instead of "Kanye-like hoodie")
    Remember to be specific but simple like above. You can mention specific artists, but not more than 2. Mention artists earlier in your answer for each category.`;

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
            prompt: `Your role is to design a single realistic lego character with realistic shoes standing directly facing us using "${creativeDescription}".`,
            n: 1,
            size: '1024x1024',
        });

        if (!imageResponse.data || imageResponse.data.length === 0) {
            throw new Error('No image was generated.');
        }

        const imageUrl = imageResponse.data[0].url;
        console.log("Original Image URL:", imageUrl);

        const removeBgResponse = await fetchWithTimeout('http://flask-app:5001/remove-background', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imageUrl })
        });

        if (!removeBgResponse.ok) {
            throw new Error(`Error from Flask service: ${removeBgResponse.statusText}`);
        }

        const buffer = await removeBgResponse.buffer();
        const outputPath = 'rhythmoji_no_bg.png'; // Assuming this is the desired output path
        fs.writeFileSync(outputPath, buffer);

        // Assuming the outputPath or a URL to this path is what should be returned
        // This should be the path or URL to the image with the background removed
        return outputPath; // Modify this to return a URL if needed

    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};


module.exports = { generateCreativePrompt, generateRhythmoji };
