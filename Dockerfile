FROM node:22-alpine
WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy code và folder prisma
COPY . .

# Generate Prisma Client & Build
RUN npx prisma generate
RUN npm run build

# Mở cổng và chạy
EXPOSE 3000
# Thử chạy từ folder src bên trong dist
CMD ["node", "dist/src/main.js"]