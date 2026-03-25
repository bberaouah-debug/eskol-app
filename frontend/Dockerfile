# Stage 1 (build)
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Inyectamos las variables de entorno para que Vite las use en el build
ARG VITE_API_URL
ARG VITE_APP_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env
RUN echo "VITE_APP_URL=$VITE_APP_URL" >> .env

RUN npm run build

# Stage 2 (serve)
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
