# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first — cached if unchanged
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build production bundle → outputs to /app/dist
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/

# Copy built React files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]