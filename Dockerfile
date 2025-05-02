FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY .npmrc .npmrc
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]