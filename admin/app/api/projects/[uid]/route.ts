import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

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
        },
        mediaBlocks: {
          orderBy: {
            order: 'asc'
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
      previousUid,
      uid,
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
      mainVideoUrl,
      mediaBlocks,
      published
    } = body

    const sourceUid = previousUid || params.uid
    const targetUid = uid || params.uid
    
    // Find or create the project
    let project = await db.project.findUnique({
      where: { uid: sourceUid }
    })

    if (!project) {
      // Create new project if it doesn't exist
      project = await db.project.create({
        data: {
          uid: targetUid,
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
      if (targetUid && targetUid !== sourceUid) updateData.uid = targetUid
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
      if (published !== undefined) updateData.published = published

      project = await db.project.update({
        where: { uid: sourceUid },
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

    // Update media blocks
    if (mediaBlocks && Array.isArray(mediaBlocks)) {
      // Remove existing media blocks
      await db.mediaBlock.deleteMany({
        where: { projectId: project.id }
      })

      // Add new media blocks
      for (let i = 0; i < mediaBlocks.length; i++) {
        const block = mediaBlocks[i]
        await db.mediaBlock.create({
          data: {
            projectId: project.id,
            type: block.type || 'gallery',
            order: block.order || i,
            leftMediaUrl: block.leftMediaUrl || null,
            leftMediaType: block.leftMediaType || null,
            rightMediaUrl: block.rightMediaUrl || null,
            rightMediaType: block.rightMediaType || null,
            middleMediaUrl: block.middleMediaUrl || null,
            middleMediaType: block.middleMediaType || null,
            leftCaption: block.leftCaption || null,
            rightCaption: block.rightCaption || null,
            middleCaption: block.middleCaption || null
          }
        })
      }
    }

    console.log('✅ Project saved successfully:', project)

    // Trigger static site regeneration
    try {
      console.log('🔄 Triggering static site regeneration...')
      const generateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/generate-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousUid: sourceUid, uid: targetUid })
      })
      
      if (generateResponse.ok) {
        console.log('✅ Static site regenerated successfully')
      } else {
        console.warn('⚠️ Static site regeneration failed')
      }
    } catch (error) {
      console.warn('⚠️ Error triggering static site regeneration:', error)
    }
    
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
