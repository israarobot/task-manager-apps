echo FROM node:18-alpine AS builder > frontend-web\Dockerfile
echo WORKDIR /app >> frontend-web\Dockerfile
echo COPY package*.json ./ >> frontend-web\Dockerfile
echo RUN npm ci >> frontend-web\Dockerfile
echo COPY . . >> frontend-web\Dockerfile
echo RUN npm run build >> frontend-web\Dockerfile
echo. >> frontend-web\Dockerfile
echo FROM nginx:alpine >> frontend-web\Dockerfile
echo COPY --from=builder /app/dist /usr/share/nginx/html >> frontend-web\Dockerfile
echo RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }" ^> /etc/nginx/conf.d/default.conf >> frontend-web\Dockerfile
echo EXPOSE 80 >> frontend-web\Dockerfile
echo CMD ["nginx", "-g", "daemon off;"] >> frontend-web\Dockerfile
