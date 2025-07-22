FROM node:18-bullseye-slim

# 1. Update and install required libraries
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget \
        gdebi-core \
        fontconfig \
        fonts-dejavu \
        python3 \
        python3-pip \
        unzip \
        curl \
        libxinerama1 \
        libxrandr2 \
        libxrender1 \
        libxi6 \
        libgl1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Download LibreOffice 25.2.5 .deb archive
RUN wget https://download.documentfoundation.org/libreoffice/stable/25.2.5/deb/x86_64/LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz

# 3. Extract and install, then symlink `soffice`
RUN tar -xzf LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    dpkg -i LibreOffice_25.2.5.*/DEBS/*.deb && \
    ln -s /opt/libreoffice*/program/soffice /usr/bin/soffice && \
    rm -rf LibreOffice_25.2.5_Linux_x86-64_deb*

# 4. Continue with app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN fc-cache -f -v

EXPOSE 3000
CMD ["node", "server.js"]
