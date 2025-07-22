# Use full Debian base with Node.js
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Install system dependencies, fonts, and Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget \
        curl \
        gnupg \
        ca-certificates \
        fontconfig \
        python3 \
        python3-pip \
        unzip \
        cabextract \
        libxinerama1 \
        libxrandr2 \
        libxrender1 \
        libxi6 \
        libgl1 \
        libgtk-3-0 \
        libnss3 \
        libasound2 \
        libxss1 \
        libxshmfence1 \
        libsm6 \
        libxml2 \
        libxslt1.1 \
        fonts-dejavu \
        ttf-mscorefonts-installer && \
    fc-cache -fv && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Agree to Microsoft fonts license (non-interactive install)
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections

# Download and install LibreOffice 25.2.5
RUN wget https://download.documentfoundation.org/libreoffice/stable/25.2.5/deb/x86_64/LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    tar -xzf LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    dpkg -i LibreOffice_25.2.5.*/DEBS/*.deb || apt-get install -f -y && \
    ln -s /opt/libreoffice*/program/soffice /usr/bin/soffice && \
    rm -rf LibreOffice_25.2.5_Linux_x86-64_deb*

# Install Node dependencies
COPY package*.json ./
RUN npm install

# Copy app files
COPY . .

# Expose application port
EXPOSE 3000

# Start app
CMD ["node", "server.js"]
