FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Bind Vite dev server to all hosts inside container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
