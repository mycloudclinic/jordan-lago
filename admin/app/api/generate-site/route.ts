import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs-extra'
import path from 'path'

/**
 * Generate static site files from current database
 */
// Ensure DB URL exists for this route execution context
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./admin.db'
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting static site generation...')
    
    // Get all published projects
    const projects = await prisma.project.findMany({
      where: { published: true },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        teamMembers: true,
        mediaBlocks: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    // Transform projects to LO2S format
    const transformedProjects = projects.map(project => ({
      uid: project.uid,
      info: {
        id: project.id,
        name: project.name,
        client: project.client,
        date: project.date.toISOString().split('T')[0],
        shortDescription: project.shortDescription,
        description: project.description.split('\n\n').map(paragraph => ({
          type: 'paragraph',
          children: [{ type: 'text', text: paragraph }]
        })),
        location: {
          country: project.country,
          city: project.city
        },
        categories: project.categories.map(pc => ({
          name: pc.category.name,
          type: pc.category.type
        })),
        team: {
          id: project.id,
          person: project.teamMembers.map(tm => ({
            name: tm.name,
            position: tm.position
          }))
        }
      },
      mainMedia: {
        mediaType: project.mainMediaType,
        src: {
          desktop: {
            url: convertCloudinaryToLocal(project.mainMediaUrl),
            // Add other properties as needed
          }
        },
        ...(project.mainVideoUrl && {
          fullVideo: {
            desktop: {
              url: convertCloudinaryToLocal(project.mainVideoUrl)
            }
          }
        })
      },
      mediaContent: project.mediaBlocks.map(block => ({
        type: block.type,
        mediaContent: {
          ...(block.leftMediaUrl && {
            left: {
              mediaType: block.leftMediaType,
              src: { desktop: { url: convertCloudinaryToLocal(block.leftMediaUrl) } }
            }
          }),
          ...(block.rightMediaUrl && {
            right: {
              mediaType: block.rightMediaType,
              src: { desktop: { url: convertCloudinaryToLocal(block.rightMediaUrl) } }
            }
          })
        }
      }))
    }))

    // Generate work.json
    const workData = {
      pageProps: {
        cms: {
          works: transformedProjects,
          categories: await getCategories(),
          general: getGeneralSettings()
        }
      },
      __N_SSG: true
    }

    const workJsonPath = path.join(process.cwd(), '../_next/data/sEgby1zVGHQ7Lgldl4hat/work.json')
    await fs.ensureDir(path.dirname(workJsonPath))
    await fs.writeJson(workJsonPath, workData, { spaces: 0 })
    
    console.log('✅ Generated work.json')

    // Update homepage with featured projects (first 4)
    await updateHomepage(transformedProjects.slice(0, 4))
    
    // Generate individual project pages
    await generateProjectPages(transformedProjects)
    
    console.log('✅ Static site generation complete!')

    return NextResponse.json({
      success: true,
      message: `Generated ${transformedProjects.length} projects`,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error generating site:', error)
    return NextResponse.json(
      { error: 'Failed to generate site' },
      { status: 500 }
    )
  }
}

/**
 * Convert Cloudinary URL to local CloudFront-style path
 */
function convertCloudinaryToLocal(cloudinaryUrl: string): string {
  // Keep Cloudinary URL as-is to avoid incorrect rewrites.
  // We previously tried to map to a local CloudFront mirror by filename only,
  // which broke nested folder paths and versioned assets.
  return cloudinaryUrl
}

async function getCategories() {
  const categories = await prisma.category.findMany()
  return categories.map(cat => ({
    name: cat.name,
    type: cat.type
  }))
}

function getGeneralSettings() {
  return {
    categories: null,
    footer: {
      copyright: "© All rights reserved",
      email: "hello@lo2s.com",
      legalsText: "Terms of Use",
      creditsText: "Credits",
      preloaderText: "Blending creativity and innovation to awaken new realms.",
      credit: [
        { name: "Design by DashDigital®", link: "https://dashdigital.studio/" },
        { name: "Dev by SALT AND PEPPER", link: "https://snp.agency/" }
      ]
    },
    pages: [
      { name: "Work", linkTo: "/work" },
      { name: "Archive", linkTo: "/archive" },
      { name: "About", linkTo: "/about" },
      { name: "Contact", linkTo: "/contact" }
    ]
  }
}

async function updateHomepage(featuredProjects: any[]) {
  // Update the homepage carousel with featured projects
  const indexPath = path.join(process.cwd(), '../index.html')
  
  if (await fs.pathExists(indexPath)) {
    let indexContent = await fs.readFile(indexPath, 'utf-8')
    
    // Update the __NEXT_DATA__ script with new featured projects
    const nextDataMatch = indexContent.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
    if (nextDataMatch) {
      const currentData = JSON.parse(nextDataMatch[1])
      currentData.props.pageProps.cms.works = featuredProjects
      
      const updatedScript = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(currentData)}</script>`
      indexContent = indexContent.replace(nextDataMatch[0], updatedScript)
      
      await fs.writeFile(indexPath, indexContent)
      console.log('✅ Updated homepage carousel')
    }
  }
}

async function generateProjectPages(projects: any[]) {
  const workDir = path.join(process.cwd(), '../work')
  
  for (const project of projects) {
    const projectPath = path.join(workDir, `${project.uid}.html`)
    
    // Read existing template or create from current project page
    if (await fs.pathExists(projectPath)) {
      let projectContent = await fs.readFile(projectPath, 'utf-8')
      
      // Update the __NEXT_DATA__ script with new project data
      const nextDataMatch = projectContent.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s)
      if (nextDataMatch) {
        const projectData = {
          props: {
            pageProps: {
              cms: { work: project }
            }
          },
          __N_SSG: true
        }
        
        const updatedScript = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(projectData)}</script>`
        projectContent = projectContent.replace(nextDataMatch[0], updatedScript)
        
        await fs.writeFile(projectPath, projectContent)
      }
    }
  }
  
  console.log(`✅ Updated ${projects.length} project pages`)
}
