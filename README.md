# NestJS Auth Template 🔐

ระบบ Auth พร้อมใช้งานทันทีด้วย NestJS + Prisma + PostgreSQL + Redis  
รองรับ: สมัครสมาชิก, ยืนยันอีเมล, JWT (Access)

---

## 🚀 Features

- ✅ Signup ด้วย email/password
- ✅ Email verification ด้วย token
- ✅ Resend verification link
- ✅ JWT Access
- ✅ Prisma ORM + PostgreSQL
- ✅ Swagger API Docs
- ✅ EmailService ด้วย nodemailer

---

## 📦 Technologies

- **NestJS**
- **Prisma**
- **PostgreSQL**
- **Redis**
- **Swagger (OpenAPI)**
- **Nodemailer**

---

## 🛠 Installation

```bash
git clone https://github.com/nattkarn/nestjs_auth_2025.git
cd nestjs_auth_2025

npm install
```
## ⚙️ Environment Setup

คัดลอกไฟล์ .env.example ไปเป็น .env

```bash
cp .env.example .env
```


จากนั้นปรับค่าต่าง ๆ ให้ตรงกับระบบของคุณ

## 📦 Docker Setup

```bash
docker compose up -d
```
สามารถปรับค่าต่าง ๆ ให้ตรงกับระบบของคุณได้ที่ docker-compose.yml

## 📦 Prisma Setup

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed    # Seed roles and permissions
```
## ▶️ Running the app
```bash
npm run dev
```

## เปิด Swagger ได้ที่:
📚 http://localhost:3000/docs

ตัวอย่าง Insomnia v.5 Collection: https://github.com/nattkarn/nestjs_auth_2025/blob/master/example_request.yaml

