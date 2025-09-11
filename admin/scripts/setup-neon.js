#!/usr/bin/env node
/**
 * Neon Database Setup Script for LO2S Admin
 * Sets up PostgreSQL database with Prisma migrations
 */

const { exec } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

console.log('🚀 Setting up Neon PostgreSQL database...')
console.log('=' * 50)

async function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${description} failed:`, error.message)
        reject(error)
      } else {
        console.log(`✅ ${description} completed`)
        if (stdout) console.log(stdout)
        resolve(stdout)
      }
    })
  })
}

async function setupNeon() {
  try {
    // 1. Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('postgresql://')) {
      console.log('⚠️  DATABASE_URL not found or not a PostgreSQL URL')
      console.log('Please set your Neon database URL in .env.local:')
      console.log('DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"')
      console.log('\n📋 To get your Neon database URL:')
      console.log('1. Go to https://neon.tech/')
      console.log('2. Create a new project')
      console.log('3. Copy the connection string from the dashboard')
      console.log('4. Add it to your .env.local file')
      process.exit(1)
    }

    console.log('✅ DATABASE_URL found')
    
    // 2. Generate Prisma client
    await runCommand('npx prisma generate', 'Generating Prisma client for PostgreSQL')
    
    // 3. Push database schema to Neon
    await runCommand('npx prisma db push', 'Creating database schema in Neon')
    
    // 4. Seed the database with categories
    console.log('📦 Seeding database with initial data...')
    
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    // Seed categories
    const categories = [
      { name: '3D Mapping', type: '3D_Mapping', color: '#3b82f6' },
      { name: 'Creative Direction', type: 'creative_direction', color: '#8b5cf6' },
      { name: 'Content Development', type: 'content_dev', color: '#10b981' },
      { name: 'Digital Art and Visuals', type: 'Digital_art_visuals', color: '#f59e0b' },
      { name: 'Lighting Design', type: 'lighting_design', color: '#ef4444' },
      { name: 'Scenography & Stage Design', type: 'scenography_design', color: '#06b6d4' },
      { name: 'Technical Management', type: 'Technical_Management', color: '#6b7280' },
    ]

    for (const category of categories) {
      await prisma.category.upsert({
        where: { type: category.type },
        update: category,
        create: category,
      })
    }
    
    await prisma.$disconnect()
    console.log('✅ Database seeded with categories')
    
    console.log('\n🎉 Neon database setup complete!')
    console.log('\n🚀 Your admin system is now connected to Neon PostgreSQL')
    console.log('🌐 Admin available at: http://localhost:3001')
    
  } catch (error) {
    console.error('❌ Neon setup failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Verify your DATABASE_URL is correct')
    console.log('2. Make sure your Neon database is accessible')
    console.log('3. Check that your IP is whitelisted in Neon (if applicable)')
    process.exit(1)
  }
}

setupNeon()
