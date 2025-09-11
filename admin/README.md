# 🎨 LO2S Admin PWA

Beautiful, Apple-style Progressive Web App for managing the LO2S portfolio website.

## ✨ Features

- **📱 PWA** - Install on any device (desktop, tablet, mobile)
- **🎨 Apple-style UI** - Clean, modern interface following Human Interface Guidelines
- **☁️ Cloudinary Integration** - Automatic image/video optimization and CDN delivery
- **🔄 Static Site Generation** - Updates your existing LO2S website automatically
- **🖼️ Media Management** - Drag & drop upload with real-time processing
- **📊 Project Management** - Full CRUD operations for portfolio projects
- **🎯 Category System** - Organize projects by service types
- **👥 Team Management** - Track team members for each project

## 🚀 Quick Start

### 1. Setup
```bash
cd admin
node scripts/setup.js
```

### 2. Configure Cloudinary
1. Go to [Cloudinary Console](https://cloudinary.com/console/settings/upload)
2. Create upload preset: `lo2s_preset`
3. Set to "Unsigned" mode
4. Configure folder: `lo2s`

### 3. Start Development
```bash
npm run dev
```

Admin app: http://localhost:3001
Static site: http://localhost:8002

## 📊 Data Structure

### Project Schema
```typescript
interface Project {
  uid: string                    // URL slug
  name: string                   // Display name
  client: string                 // Client name
  date: Date                     // Project date
  shortDescription: string       // Brief description
  description: string            // Full description
  location: { country, city }    // Project location
  categories: string[]           // Service categories
  mainMedia: {                   // Cover media
    type: 'image' | 'video'
    url: string                  // Cloudinary URL
  }
  additionalMedia: MediaBlock[]  // Additional images/videos
}
```

### Media Management
- **Auto-resizing**: Images automatically generated in 8 sizes (128px to 3072px)
- **Format optimization**: WebP conversion for web delivery
- **Video compression**: Automatic optimization for streaming
- **CDN delivery**: Global Cloudinary CDN for fast loading

## 🔄 Workflow

1. **Upload Media** → Cloudinary (auto-optimized)
2. **Create/Edit Projects** → Database
3. **Generate Static Site** → Updates HTML files
4. **Deploy** → Your existing hosting setup

## 🎯 Integration

The admin app integrates seamlessly with your existing LO2S static site:

- **Reads existing projects** from work.json
- **Maintains file structure** (work/*.html, _next/*, etc.)
- **Updates in place** - no migration needed
- **Preserves URLs** - all existing links continue working

## 📱 PWA Features

- **Offline capability** - Works without internet
- **Install prompts** - Add to home screen on mobile
- **Push notifications** - Optional for upload completion
- **Background sync** - Queue uploads when offline

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** for type safety
- **Tailwind CSS** + **Shadcn/ui** for Apple-style components
- **Framer Motion** for smooth animations
- **Prisma** for database management
- **Cloudinary** for media processing
- **PWA** capabilities with service worker

## 🎨 Design Principles

Following Apple's Human Interface Guidelines:
- **Clarity** - Clean, focused interface
- **Deference** - Content is king
- **Depth** - Layered, spatial design
- **Smooth animations** - Spring-based transitions
- **Responsive** - Works beautifully on all devices
