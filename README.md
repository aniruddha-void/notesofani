# 📚 NotesofAni

<p align="center">
  <img src="https://img.shields.io/badge/NotesofAni-Digital%20Knowledge%20Library-2563EB?style=for-the-badge&logo=bookstack&logoColor=white" alt="NotesofAni">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Backblaze%20B2-Storage-E21E25?style=for-the-badge&logo=backblaze&logoColor=white" alt="Backblaze B2">
</p>

<p align="center">
  <strong>A modern digital knowledge library for students.</strong>
  <br />
  Notes • PDFs • PYQs • Learning Resources • Secure Downloads
</p>

<p align="center">
  <a href="#-live-project">Live Project</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-security">Security</a>
</p>

---

# 🌐 Live Project

🚀 **Frontend:**  
https://notesofani-z8fp.vercel.app

⚙️ **Backend API:**  
https://notesofani.onrender.com

The application is deployed using:

- **Frontend → Vercel**
- **Backend → Render**
- **Database → MongoDB Atlas**
- **Object Storage → Backblaze B2**

---

# 📖 About NotesofAni

**NotesofAni** is a full-stack digital knowledge library designed to make college learning resources easier to access, organize, and manage.

The platform allows students to access:

- 📄 College Notes
- 📚 PDF Resources
- 📝 Previous Year Questions
- 🔗 External Learning Resources
- 🎥 Lecture / Learning Video Links
- ⭐ Favorites
- 📥 Download History
- 👤 Personal Profile
- 🔐 Protected Resources

An administrator can securely manage the educational resources available on the platform.

The project was built as a complete production-oriented MERN/Next.js application rather than only a basic CRUD project.

---

# 🎯 Project Goal

The original idea behind NotesofAni was to build a simple place where students could easily find and access useful academic resources.

During development, the project evolved into a complete digital knowledge library with:

- User authentication
- Google authentication
- Admin authentication
- Admin dashboard
- Resource management
- PDF upload
- Private cloud storage
- Resource password protection
- Favorites
- Download tracking
- Secure file streaming
- Production CORS configuration
- Production API configuration
- Cloud deployment
- Automated backend testing

---

# ✨ Features

## 👨‍🎓 Student Features

### 🔐 Authentication

Users can securely authenticate using:

- Google OAuth
- Application authentication
- JWT-based authentication
- HTTP-only cookies

---

### 🏠 Home Page

The home page provides:

- Clean modern interface
- Resource discovery
- Search experience
- Featured resources
- Navigation to important sections
- Responsive design
- Smooth animations

---

### 📚 Resource Library

Users can browse available learning resources.

Resources can contain:

- Title
- Description
- Subject
- Category
- Resource type
- PDF files
- External links
- Video links
- Metadata

---

### 🔎 Resource Search

Users can search and discover resources from the knowledge library.

---

### 📄 PDF Viewing

Users can open supported PDF resources directly through the application.

Production PDF requests are routed through:

```text
GET /api/v1/resources/:id/file
