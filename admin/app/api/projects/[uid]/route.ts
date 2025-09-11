import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log('📂 Loading project:', params.uid)
    
    const project = await db.project.findUnique({
      where: { uid: params.uid },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Format the response to match the expected structure
    const formattedProject = {
      ...project,
      date: project.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      categories: project.categories.map(pc => pc.category.name)
    }

    console.log('✅ Project loaded:', formattedProject)
    
    return NextResponse.json({ 
      success: true,
      project: formattedProject
    })
    
  } catch (error) {
    console.error('❌ Error loading project:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log('🔄 Saving project:', params.uid)
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const {
      name,
      client,
      date,
      shortDescription,
      description,
      country,
      city,
      categories,
      mainMediaType,
      mainMediaUrl,
      mainVideoUrl
    } = body

    // Find or create the project
    let project = await db.project.findUnique({
      where: { uid: params.uid }
    })

    if (!project) {
      // Create new project if it doesn't exist
      project = await db.project.create({
        data: {
          uid: params.uid,
          name: name ?? params.uid,
          client: client ?? '',
          date: date ? new Date(date) : new Date(),
          shortDescription: shortDescription ?? '',
          description: (description ?? ''),
          country: country ?? '',
          city: city ?? '',
          mainMediaType: mainMediaType || 'video',
          mainMediaUrl: mainMediaUrl || '',
          mainVideoUrl: mainVideoUrl || '',
          published: true
        }
      })
    } else {
      // Update existing project
      const updateData: any = {}
      if (name !== undefined) updateData.name = name
      if (client !== undefined) updateData.client = client
      if (date !== undefined) {
        const parsedDate = new Date(date)
        if (!isNaN(parsedDate.getTime())) updateData.date = parsedDate
      }
      if (shortDescription !== undefined) updateData.shortDescription = shortDescription
      if (description !== undefined) updateData.description = description || ''
      if (country !== undefined) updateData.country = country
      if (city !== undefined) updateData.city = city
      if (mainMediaType !== undefined) updateData.mainMediaType = mainMediaType || 'video'
      if (mainMediaUrl !== undefined) updateData.mainMediaUrl = mainMediaUrl || ''
      if (mainVideoUrl !== undefined) updateData.mainVideoUrl = mainVideoUrl || ''

      project = await db.project.update({
        where: { uid: params.uid },
        data: updateData
      })
    }

    // Update categories
    if (categories && Array.isArray(categories)) {
      // Remove existing categories
      await db.projectCategory.deleteMany({
        where: { projectId: project.id }
      })

      // Add new categories
      for (const categoryName of categories) {
        let category = await db.category.findFirst({
          where: { name: categoryName }
        })

        if (!category) {
          // Create category if it doesn't exist
          category = await db.category.create({
            data: {
              name: categoryName,
              type: categoryName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
            }
          })
        }

        await db.projectCategory.create({
          data: {
            projectId: project.id,
            categoryId: category.id
          }
        })
      }
    }

    console.log('✅ Project saved successfully:', project)
    
    return NextResponse.json({ 
      success: true, 
      project,
      message: 'Project saved successfully!'
    })
    
  } catch (error) {
    console.error('❌ Error saving project:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { 
        error: 'Failed to save project',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
