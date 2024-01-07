# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source inside the Docker image
COPY . .

# Make port available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV SPOTIPY_CLIENT_ID abcdc6ec5e66488ab295abb3a4401917
ENV SPOTIPY_CLIENT_SECRET 9ed30e1571364288b2a8a1b690f2ea91
ENV SPOTIPY_REDIRECT_URI http://localhost:3000/callback
ENV OPEN_AI_KEY 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



# Run the app when the container launches
CMD ["node", "app.js"]
