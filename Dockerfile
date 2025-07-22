# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Install LibreOffice and required dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libreoffice \
        python3 \
        python3-pip \
        curl \
        fontconfig \
        fonts-dejavu \
        ttf-mscorefonts-installer \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install

# ✅ Copy application code
COPY . .

# ✅ Expose app port
EXPOSE 3000

# ✅ Start Node.js server
CMD ["node", "server.js"]
