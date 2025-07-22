# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Install Python, LibreOffice, font tools, and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        libreoffice \
        unzip \
        curl \
        fontconfig \
        && apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Copy Microsoft fonts into system font directory
COPY fonts /usr/share/fonts/truetype/microsoft

# ✅ Rebuild font cache
RUN fc-cache -f -v

# ✅ Copy only package files first to optimize layer caching
COPY package*.json ./
RUN npm install

# ✅ Copy entire app (including server, routes, scripts, etc.)
COPY . .

# ✅ Expose the port your Node app runs on
EXPOSE 3000

# ✅ Start the Node.js server
CMD ["node", "server.js"]
