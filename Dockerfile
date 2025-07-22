FROM node:18-bullseye-slim

# 1. Update and install required utilities
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
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Download LibreOffice 25.2.5 .deb archive
RUN wget https://download.documentfoundation.org/libreoffice/stable/25.2.5/deb/x86_64/LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz

# 3. Extract and install LibreOffice, then symlink `soffice` binary
RUN tar -xzf LibreOffice_25.2.5_Linux_x86-64_deb.tar.gz && \
    dpkg -i LibreOffice_25.2.5.*/DEBS/*.deb && \
    ln -s /opt/libreoffice*/program/soffice /usr/bin/soffice && \
    rm -rf LibreOffice_25.2.5_Linux_x86-64_deb*

# 4. Optionally, install help/lang packs if needed
# RUN dpkg -i LibreOffice_xxx/DEBS/desktop-integration/*.deb

# 5. Install node dependencies and copy app code
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 6. Refresh font cache
RUN fc-cache -f -v

# 7. Expose app port and start server
EXPOSE 3000
CMD ["node", "server.js"]
