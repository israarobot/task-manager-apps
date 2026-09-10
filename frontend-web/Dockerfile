(
echo FROM node:18-alpine AS builder
echo WORKDIR /app
echo COPY package*.json ./
echo RUN npm ci
echo COPY . .
echo RUN npm run build
echo.
echo FROM nginx:alpine
echo COPY --from=builder /app/dist /usr/share/nginx/html
echo RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }" ^> /etc/nginx/conf.d/default.conf
echo EXPOSE 80
echo CMD ["nginx", "-g", "daemon off;"]
) > frontend-web\Dockerfile
