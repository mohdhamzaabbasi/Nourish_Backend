FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your app runs on
EXPOSE 8080

# Define environment variables (adjust as needed)
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]
