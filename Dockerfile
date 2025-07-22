# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# ✅ Install Python, LibreOffice, and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        libreoffice \
        unzip \
        curl \
        fonts-dejavu \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Install node dependencies early for better layer caching
COPY package*.json ./
RUN npm install

# ✅ Copy full app including Python and frontend/public folders
COPY . .

# ✅ Expose app port
EXPOSE 3000

# ✅ Start server
CMD ["node", "server.js"]
