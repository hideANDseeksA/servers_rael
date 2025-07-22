# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Preconfigure environment for font installer (accept EULA silently)
ENV DEBIAN_FRONTEND=noninteractive

# ✅ Install dependencies, LibreOffice, and Microsoft fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        python3 \
        python3-pip \
        libreoffice \
        unzip \
        fontconfig \
        fonts-dejavu \
        fonts-liberation \
        ttf-mscorefonts-installer \
        && echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Refresh font cache
RUN fc-cache -f -v

# ✅ Optional: copy custom .ttf fonts (like Calibri if you legally have it)
# COPY ./fonts /usr/share/fonts/truetype/custom
# RUN fc-cache -f -v

# ✅ Copy Node dependencies first for better caching
COPY package*.json ./
RUN npm install

# ✅ Copy rest of the application
COPY . .

# ✅ Expose port (adjust if needed)
EXPOSE 3000

# ✅ Start the Node.js server
CMD ["node", "server.js"]
