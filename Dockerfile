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

# ✅ Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# ✅ Copy full app
COPY . .

# ✅ Copy custom fonts and register them
RUN mkdir -p /usr/share/fonts/truetype/custom && \
    cp -r ./fonts/* /usr/share/fonts/truetype/custom/ && \
    fc-cache -f -v

# ✅ Expose the app port
EXPOSE 3000

# ✅ Start server
CMD ["node", "server.js"]
