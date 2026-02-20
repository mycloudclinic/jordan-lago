import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

/**
 * Returns real project counts from the database for the dashboard.
 */
export async function GET() {
  try {
    const [totalProjects, publishedProjects, totalMediaBlocks] = await Promise.all([
      db.project.count(),
      db.project.count({ where: { published: true } }),
      db.mediaBlock.count(),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects,
        publishedProjects,
        draftProjects: totalProjects - publishedProjects,
        totalMediaBlocks,
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}
