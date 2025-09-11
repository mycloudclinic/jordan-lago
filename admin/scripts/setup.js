#!/usr/bin/env node
/**
 * Setup script for LO2S Admin PWA
 * Initializes database, imports existing projects, and sets up Cloudinary
 */

const { exec } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

console.log('🚀 Setting up LO2S Admin PWA...')
console.log('=' * 50)

async function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${description} failed:`, error)
        reject(error)
      } else {
        console.log(`✅ ${description} completed`)
        if (stdout) console.log(stdout)
        resolve(stdout)
      }
    })
  })
}

async function setup() {
  try {
    // 1. Install dependencies
    await runCommand('npm install', 'Installing dependencies')
    
    // 2. Generate Prisma client
    await runCommand('npx prisma generate', 'Generating Prisma client')
    
    // 3. Initialize database
    await runCommand('npx prisma db push', 'Initializing database')
    
    // 4. Seed categories
    await runCommand('npx prisma db seed', 'Seeding database with categories')
    
    // 5. Check if .env.local exists
    const envPath = path.join(__dirname, '../.env.local')
    if (!await fs.pathExists(envPath)) {
      console.log('⚠️  .env.local not found. Creating template...')
      const envTemplate = `# Cloudinary (public)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="YOUR_UNSIGNED_PRESET"

# Cloudinary (server)
CLOUDINARY_CLOUD_NAME="YOUR_CLOUD_NAME"
CLOUDINARY_API_KEY="YOUR_API_KEY"
CLOUDINARY_API_SECRET="YOUR_API_SECRET"

# Static site paths (relative to admin folder)
STATIC_SITE_PATH="../"
WORK_PAGES_PATH="../work"
ASSETS_PATH="../d2csodhem33bqt.cloudfront.net/uploads"

# Admin app
NEXTAUTH_SECRET="lo2s-admin-secret-2024"
NEXTAUTH_URL="http://localhost:3001"
DATABASE_URL="file:./admin.db"
`
      await fs.writeFile(envPath, envTemplate)
      console.log('✅ Created .env.local template')
    }
    
    // 6. Create Cloudinary upload preset info
    console.log('\n📋 Cloudinary Setup Instructions:')
    console.log('1. Go to https://cloudinary.com/console/settings/upload')
    console.log('2. Create a new upload preset named: "lo2s_preset"')
    console.log('3. Set it to "Unsigned" mode')
    console.log('4. Configure folder: "lo2s"')
    console.log('5. Enable auto-optimization and format conversion')
    
    console.log('\n🎉 Setup complete!')
    console.log('\n🚀 To start the admin app:')
    console.log('   cd admin')
    console.log('   npm run dev')
    console.log('\n🌐 Admin will be available at: http://localhost:3001')
    console.log('🌐 Static site available at: http://localhost:8002')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

setup()
