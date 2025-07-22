# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Install LibreOffice and safe fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libreoffice \
        python3 \
        python3-pip \
        curl \
        fontconfig \
        fonts-dejavu \
        fonts-liberation \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Copy Node.js project files
COPY package*.json ./
RUN npm install

# ✅ Copy application code
COPY . .

# ✅ Expose the app port
EXPOSE 3000

# ✅ Start your server
CMD ["node", "server.js"]
