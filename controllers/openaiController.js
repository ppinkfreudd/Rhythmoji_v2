const { OpenAI } = require('openai');
const { exec } = require('child_process');
require('dotenv').config();


const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

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
    const artists = artistObjects.slice(0, 1).map(a => a.name);

    console.log(artists);
    let prompt = `Optimize your answer for feeding into dall-e-3. Keep your response under 75 words. Using ${genres.join(", ")} and ${artists.join(", ")} and information from latest internet fashion trends (search for these) and your knowledge of good Dall-E prompts, fill out the following template. If you are to mention an artist, use a "-like" (e.g. Drake-like hoodie):

    Head: the head must be that of an animal (related to their genres)
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
            prompt: `Your role is to design a single lego character standing directly facing us using "${creativeDescription}". Focus on the artists and brands mentioned, make them evident, and make sure part only includes the style described for that part. Transparent background. Make sure it has yello hands. Make sure the lego is wearing the shoes and accessories. `, 
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