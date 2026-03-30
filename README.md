
# 📱 Social Media Platform

[![Backend](https://img.shields.io/badge/Backend-Node.js-green)](https://nodejs.org/)  
[![Frontend](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)  
[![Database](https://img.shields.io/badge/Database-MySQL-blueviolet)](https://www.MySQl.org/)  
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A **full-featured social media platform** built with **Express.js + Prisma** (backend) and **React.js + Vite** (frontend) 🌐🚀  

_Built with ❤️ by [Shehab Elbana ]_
---

## ✨ Features Overview

### 🔐 Authentication & Users
- 👤 User registration & login (**JWT Authentication**)  
- ✏️ Update profile (name, image, cover, city)  
- ❌ Delete account  
- 📑 Get all users with pagination  
- 👥 Follow / unfollow users  
- 🌟 Suggested users  
- 🔢 Count followers & followings  

### 📝 Posts
- ➕ Create, update, delete posts (text + images)  
- 📄 View single/all posts (pagination)  
- 👍 Like / Unlike posts  
- 🔄 Share posts  
- 💾 Save / unsave posts  
- 📑 View posts by user  
- 🔢 Like count updates  

### 💬 Comments & Replies
- ✍️ Add comments  
- ↩️ Reply to comments  
- ❌ Delete comments/replies  
- 👍 Like / Unlike comments  
- ❤️ Like / Unlike replies  

### 📖 Stories
- ➕ Create stories (image/video)  
- ⏳ Auto-expire after 24h  
- 💬 Comment on stories  
- 👍 Like / Unlike stories  
- 🕒 Auto cleanup with **cron job**  

### 🔔 Notifications
Triggered by:
- 👍 Post likes  
- 💬 Comment likes  
- ↩️ Reply likes  
- ✍️ New comments  
- 💭 New replies  
- 👥 New followers  
- ✅ Mark as read  
- ❌ Delete notifications  

---

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js  
- Prisma ORM + MySQL 
- JWT Authentication  
- Bcrypt → password hashing  
- Helmet + CORS + rate limiting → security  
- Node-cron → scheduled story cleanup  

### Frontend
- React.js + Vite  
- React Query → caching & pagination  
- Axios → API calls  
- React Hook Form + Zod → validation  
- Lucide React → icons  
- Moment.js → formatting timestamps  
- SCSS → responsive & themable  

## 💡 Notes
- Stories auto-delete after 24h via a **cron job**.  
- JWT token required in `Authorization` header for protected routes.  
- Frontend uses **React Query** for caching & pagination.  

---

## 🎨 Badges
[![React](https://img.shields.io/badge/React-17.0.2-blue)](https://reactjs.org/)  
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0-green)](https://nodejs.org/)  
[![Express](https://img.shields.io/badge/Express-5.0.0-lightgrey)](https://expressjs.com/)  
[![Prisma](https://img.shields.io/badge/Prisma-6.19.0-blue)](https://www.prisma.io/)  
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blueviolet)](https://www.postgresql.org/)  
 
