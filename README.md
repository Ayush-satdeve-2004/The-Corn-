# The-Corn-

🌽 **The Corn** — A privacy-focused, high-security social networking web application inspired by Instagram, built with React, Vite, Express, and MongoDB Atlas.

## 🌟 Key Features

- **🔐 Privacy & Anti-Hack Shield**:
  - **Dynamic Watermarking**: User data floating watermarks over photos, videos, and text posts.
  - **Anti-Screenshot & Anti-Screen-Recording**: Intercepts `PrintScreen`, `Cmd+Shift+3/4/5`, `Win+Shift+S`, clears system clipboard, and obscures screen on focus loss.
  - **DevTools Inspection Trap**: Detects browser devtools inspection and triggers defensive countermeasures.

- **📱 Core Social Features**:
  - **Home Feed**: Real-time post feed with 100% full-screen responsive media viewer.
  - **Post Types**: Support for Photos, Videos (Admin: 1 GB limit, Users: 500 MB limit), and Text posts with custom gradient themes.
  - **Social Engagement**: Likes, comments (with comment deletion), post saving, and friend sharing.
  - **Friends & Search**: User search bar, friend requests, and accepted friends list.
  - **User Profiles**: Account settings, password reset with Brevo Email OTP, post history, and liked/saved posts.

- **🛡️ Admin Control Panel (`/admin`)**:
  - **Pending Registration Approvals**: 24-hour approval workflow for new accounts.
  - **Active User Management**: Delete user accounts and associated posts.
  - **Post Moderation**: Manage and delete any user photo, video, or text post.

- **⚡ Performance & Data Saving**:
  - `preload="metadata"` on videos and `loading="lazy"` on images for low mobile internet consumption.
  - Instant 0ms cached session initialization in AuthContext.

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, CSS3
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas (Mongoose)
- **Services**: Brevo API (Transactional Email OTP), Cloudinary (Media Streaming)

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (`.env`)
```env
PORT=5001
MONGODB_URI=your_mongodb_atlas_connection_string
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_email@gmail.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Run Locally

**Backend Server**:
```bash
node backend/server.js
```

**Frontend Dev Server**:
```bash
npm run dev
```

Open `http://127.0.0.1:5173/` in your browser.
