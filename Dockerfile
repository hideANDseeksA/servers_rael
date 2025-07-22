# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Preconfigure environment to be non-interactive
ENV DEBIAN_FRONTEND=noninteractive

# ✅ Install dependencies in correct order
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        debconf-utils \
        curl \
        ca-certificates && \
    echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        libreoffice \
        unzip \
        fontconfig \
        fonts-dejavu \
        fonts-liberation \
        ttf-mscorefonts-installer && \
    fc-cache -f -v && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Optional: Include custom fonts like Calibri
# COPY ./fonts /usr/share/fonts/truetype/custom
# RUN fc-cache -f -v

# ✅ Install Node dependencies
COPY package*.json ./
RUN npm install

# ✅ Copy the rest of the app
COPY . .

# ✅ Expose application port
EXPOSE 3000

# ✅ Start the server
CMD ["node", "server.js"]
