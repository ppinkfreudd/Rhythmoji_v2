const fetch = require('node-fetch');
const { Rembg } = require('rembg');
console.log(Rembg);
const fs = require('fs');
const { removeBackgroundFromImageUrl } = require('rembg');

const removeBackground = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();

        const output = await Rembg.removeBackgroundFromImageUrl({ buffer });

        fs.writeFileSync('output_no_bg.png', output);
        console.log('Background removed successfully, saved as output_no_bg.png');
    } catch (error) {
        console.error("Error removing background:", error);
    }
};

// Replace with a known working image URL for testing
const testImageUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-k8kGwStilUwtw4XI5Ik3efuz/user-1OprRXrEGkUJ5deqH5aLO8Ml/img-DE3YixmIF2EUF7l9D4OuftH6.png?st=2024-01-07T00%3A21%3A35Z&se=2024-01-07T02%3A21%3A35Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-01-06T22%3A52%3A47Z&ske=2024-01-07T22%3A52%3A47Z&sks=b&skv=2021-08-06&sig=RJMEpeWzS8WW9kGg8wBWJDMx8sZ3PQWYCQoBV8uD0k0%3D';
removeBackground(testImageUrl);
