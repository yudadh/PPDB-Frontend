# Tahap 1: Build stage
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build  # Vite akan membaca vite.config.ts

# Tahap 2: Serve static site
FROM nginx:alpine

# Copy hasil build ke direktori nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# (Opsional) Copy custom nginx config jika perlu
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
