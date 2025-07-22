FROM node:18-bullseye-slim

# 1. Install system dependencies required by LibreOffice
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
        libgtk-3-0 \
        libnss3 \
        libasound2 \
        libxss1 \
        libxshmfence1 \
        libsm6 \
        libxml2 \
        libxslt1.1 \
        ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Download and install LibreOffice 25.2.5
RUN wget https://download.documentfoundation.org/libreoffice/stable/25.2.5/deb/x86_64/LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    tar -xzf LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    dpkg -i LibreOffice_25.2.5.*/DEBS/*.deb && \
    ln -s /opt/libreoffice25.2/program/soffice /usr/bin/soffice && \
    rm -rf LibreOffice_25.2.5_Linux_x86-64_deb*

# 3. Setup working directory
WORKDIR /app

# 4. Install Node.js dependencies
COPY package*.json ./
RUN npm install

# 5. Copy application files
COPY . .

# 6. Update font cache
RUN fc-cache -f -v

EXPOSE 3000

# 7. Start the application
CMD ["node", "server.js"]
