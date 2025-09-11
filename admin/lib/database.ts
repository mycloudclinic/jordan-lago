import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Seed the database with initial categories
 */
export async function seedCategories() {
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
    await db.category.upsert({
      where: { type: category.type },
      update: category,
      create: category,
    })
  }
}

/**
 * Import existing LO2S projects from JSON data
 */
export async function importExistingProjects() {
  // This will read the existing work.json and import projects
  const fs = await import('fs/promises')
  const path = await import('path')
  
  try {
    const workJsonPath = path.join(process.cwd(), '../_next/data/sEgby1zVGHQ7Lgldl4hat/work.json')
    const workData = JSON.parse(await fs.readFile(workJsonPath, 'utf-8'))
    
    const existingProjects = workData.pageProps.cms.works
    
    for (const project of existingProjects) {
      // Check if project already exists
      const existingProject = await db.project.findUnique({
        where: { uid: project.uid }
      })
      
      if (!existingProject) {
        // Create new project
        const createdProject = await db.project.create({
          data: {
            uid: project.uid,
            name: project.info.name,
            client: project.info.client,
            date: new Date(project.info.date),
            shortDescription: project.info.shortDescription,
            description: project.info.description?.map((p: any) => 
              p.children?.map((c: any) => c.text).join('') || ''
            ).join('\n\n') || '',
            country: project.info.location.country,
            city: project.info.location.city,
            mainMediaType: project.mainMedia.mediaType,
            mainMediaUrl: project.mainMedia.src.desktop.url,
            mainVideoUrl: project.mainMedia.fullVideo?.desktop?.url,
            published: true,
          }
        })

        // Add categories
        for (const category of project.info.categories || []) {
          const dbCategory = await db.category.findFirst({
            where: { name: category.name }
          })
          
          if (dbCategory) {
            await db.projectCategory.create({
              data: {
                projectId: createdProject.id,
                categoryId: dbCategory.id
              }
            })
          }
        }

        // Add team members
        if (project.info.team?.person) {
          for (const person of project.info.team.person) {
            await db.teamMember.create({
              data: {
                projectId: createdProject.id,
                name: person.name,
                position: person.position
              }
            })
          }
        }

        console.log(`✅ Imported project: ${project.info.name}`)
      }
    }
    
    console.log('✅ Project import complete')
  } catch (error) {
    console.error('Error importing projects:', error)
  }
}

export default db
