FROM node:18-bullseye-slim

WORKDIR /app

# Set environment to avoid tzdata or font prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies, LibreOffice, and fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apt-utils \
        software-properties-common \
        wget \
        curl \
        unzip \
        fontconfig \
        gnupg \
        debconf-utils \
        python3 \
        python3-pip \
        libreoffice \
        fonts-dejavu \
        fonts-liberation \
        fonts-crosextra-carlito \
        fonts-crosextra-caladea && \
    echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
    apt-get install -y --no-install-recommends ttf-mscorefonts-installer && \
    fc-cache -f -v && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy full app
COPY . .

# Expose port
EXPOSE 3000

CMD ["node", "server.js"]
