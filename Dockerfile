# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Install Python, LibreOffice, and all fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        libreoffice \
        unzip \
        curl \
        wget \
        fontconfig \
        fonts-dejavu \
        ttf-mscorefonts-installer \
        fonts-liberation \
        fonts-crosextra-carlito \
        fonts-crosextra-caladea \
        && fc-cache -f -v && \
        apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Pre-accept license for MS core fonts
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections

# ✅ Install node dependencies
COPY package*.json ./
RUN npm install

# ✅ Copy application source code
COPY . .

# ✅ Expose app port
EXPOSE 3000

# ✅ Start server
CMD ["node", "server.js"]
