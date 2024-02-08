# Use an official Python runtime as a parent image
FROM python:3.9

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Download the rembg model file
RUN mkdir -p /root/.u2net/ && \
    wget -O /root/.u2net/u2net.onnx "https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx"

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Make port available to the world outside this container
EXPOSE 5001

# Define environment variable
ENV NAME World

# Run the app when the container launches
CMD ["python", "-u", "app.py"]
