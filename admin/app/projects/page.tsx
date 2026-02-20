'use client'

import { useState, useEffect } from 'react'

const PREVIEW_BASE = process.env.NEXT_PUBLIC_PREVIEW_URL || 'http://localhost:8000'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load projects from API
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        } else {
          console.error('Failed to load projects')
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProjects()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Projects</h1>
              <p className="text-sm text-gray-400">Manage your portfolio</p>
            </div>
            <a href="/projects/new" className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors">
              + Add Project
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search projects or clients..."
            className="w-full max-w-md px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-white/30 focus:outline-none transition-colors"
          />
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-700"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-white/60 mb-4">No projects found</div>
              <a href="/projects/new" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Create First Project
              </a>
            </div>
          ) : (
            projects.map((project, index) => (
              <div
                key={project.uid}
                className="group bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-black/50 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Project Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
                  {project.mainMediaUrl ? (
                    project.mainMediaType === 'video' ? (
                      <video 
                        src={project.mainMediaUrl} 
                        className="w-full h-full object-cover"
                        muted 
                        loop 
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img 
                        src={project.mainMediaUrl} 
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                        {project.mainMediaType === 'video' ? (
                          <div className="w-8 h-8 text-white text-center">🎬</div>
                        ) : (
                          <div className="w-8 h-8 text-white text-center">🖼️</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="flex space-x-2">
                      <a href={`/projects/${project.uid}/edit`} className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors">
                        ✏️
                      </a>
                      <a href={`${PREVIEW_BASE}/work/${project.uid}.html`} target="_blank" className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors">
                        👁️
                      </a>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">{project.client}</p>
                    </div>
                    <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                      ⋯
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-4">
                    {project.shortDescription}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{project.city}, {project.country}</span>
                    <span>{new Date(project.date).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Categories */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.categories && project.categories.slice(0, 2).map((category: any, catIndex: number) => (
                      <span
                        key={catIndex}
                        className="px-2 py-1 bg-white/10 text-white text-xs rounded-lg"
                      >
                        {typeof category === 'string' ? category : category.name}
                      </span>
                    ))}
                    {project.categories && project.categories.length > 2 && (
                      <span className="px-2 py-1 bg-white/10 text-white text-xs rounded-lg">
                        +{project.categories.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${project.published ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      <span className="text-xs text-white/60">
                        {project.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="text-xs text-white/40">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Project Card */}
        <div className="mt-6">
          <a href="/projects/new" className="block bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:bg-white/10 hover:border-white/30 transition-all">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">+</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Add New Project</h3>
            <p className="text-gray-400">Create a new portfolio project</p>
          </a>
        </div>
      </div>
    </div>
  )
}