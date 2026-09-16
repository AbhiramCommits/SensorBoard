FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Bake the API base URL into the bundle at build time.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html

USER nginx

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
