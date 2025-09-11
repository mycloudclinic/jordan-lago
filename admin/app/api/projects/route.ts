import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { generateSlug } from '@/lib/utils'

export async function GET() {
  try {
    const projects = await db.project.findMany({
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

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      client,
      date,
      shortDescription,
      description,
      country,
      city,
      mainMediaType,
      mainMediaUrl,
      mainVideoUrl,
      categories,
      teamMembers,
      seoTitle,
      seoDescription,
      seoKeywords
    } = body

    // Generate unique slug
    let uid = generateSlug(name)
    let counter = 1
    while (await db.project.findUnique({ where: { uid } })) {
      uid = `${generateSlug(name)}-${counter}`
      counter++
    }

    // Get next order position
    const lastProject = await db.project.findFirst({
      orderBy: { order: 'desc' }
    })
    const order = (lastProject?.order || 0) + 1

    // Create project
    const project = await db.project.create({
      data: {
        uid,
        name,
        client,
        date: new Date(date),
        shortDescription,
        description: description || '',
        country,
        city,
        mainMediaType,
        mainMediaUrl,
        mainVideoUrl,
        order,
        seoTitle: seoTitle || name,
        seoDescription: seoDescription || shortDescription,
        seoKeywords,
        published: false // Start as draft
      }
    })

    // Add categories
    if (categories && categories.length > 0) {
      for (const categoryName of categories) {
        const category = await db.category.findFirst({
          where: { name: categoryName }
        })
        
        if (category) {
          await db.projectCategory.create({
            data: {
              projectId: project.id,
              categoryId: category.id
            }
          })
        }
      }
    }

    // Add team members
    if (teamMembers && teamMembers.length > 0) {
      for (const member of teamMembers) {
        await db.teamMember.create({
          data: {
            projectId: project.id,
            name: member.name,
            position: member.position
          }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      project: { ...project, uid } 
    })
    
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
