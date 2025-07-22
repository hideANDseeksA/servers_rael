# ✅ Base image with Node.js
FROM node:18-bullseye-slim

# ✅ Set working directory
WORKDIR /app

# ✅ Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# ✅ Install system dependencies and LibreOffice
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
        fonts-liberation && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ✅ Copy Microsoft fonts (Calibri, Arial, etc.) from ./fonts directory
COPY ./fonts /usr/share/fonts/truetype/custom
RUN fc-cache -f -v

# ✅ Install Node.js dependencies
COPY package*.json ./
RUN npm install

# ✅ Copy the rest of the app
COPY . .

# ✅ Expose application port
EXPOSE 3000

# ✅ Start the Node.js server
CMD ["node", "server.js"]
