FROM node:18-bullseye-slim

# 1. Install dependencies and Microsoft fonts
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

# 2. Download and install LibreOffice 25.2.5
RUN wget https://download.documentfoundation.org/libreoffice/stable/25.2.5/deb/x86_64/LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    tar -xzf LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    dpkg -i LibreOffice_25.2.5.*/DEBS/*.deb && \
    ln -s /opt/libreoffice25.2/program/soffice /usr/bin/soffice && \
    rm -rf LibreOffice_25.2.5_Linux_x86-64_deb*

# 3. Set up app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 4. Final cache refresh
RUN fc-cache -f -v

EXPOSE 3000
CMD ["node", "server.js"]
