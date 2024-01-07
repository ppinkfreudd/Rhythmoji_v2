# Use an official Python runtime as a parent image
FROM python:3.11.6

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Make port available to the world outside this container
EXPOSE 5001

# Define environment variable
ENV NAME World

# Run the app when the container launches
CMD ["python", "app.py"]
