# --- Stage 1: Build React App ---
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# 1. Create the directory for certificates
RUN mkdir -p /etc/nginx/certs

# 2. COPY the certificates from your computer into the image
# (Ensure these files exist in the client/ folder before building)
COPY nginx-selfsigned.crt /etc/nginx/certs/nginx-selfsigned.crt
COPY nginx-selfsigned.key /etc/nginx/certs/nginx-selfsigned.key

# Copy built static files from previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]