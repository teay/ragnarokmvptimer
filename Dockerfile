# ขั้นตอนการ build
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json และ lock file
COPY package*.json ./
COPY bun.lockb ./

# ติดตั้ง dependencies
RUN npm install

# Copy โค้ดทั้งหมด
COPY . .

# Build แอพพลิเคชัน
RUN npm run build

# ขั้นตอนการรัน
FROM nginx:alpine

# Copy ไฟล์ build ไปยัง Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# เปิดพอร์ต 80
EXPOSE 80

# เริ่มต้น Nginx
CMD ["nginx", "-g", "daemon off;"]