export default function ProjectsPage() {
  const mockProjects = [
    {
      uid: 'shkoon-msrahiya-album-tour',
      name: 'Shkoon | Msrahiya Album Tour',
      client: 'Meiosis',
      date: '2023-12-01',
      shortDescription: 'Msrahiya Album Tour',
      location: { country: 'Tour', city: 'World' },
      categories: ['Content Development', 'Digital Art and Visuals', 'Creative Direction'],
      mediaType: 'video'
    },
    {
      uid: 'hozho_2',
      name: 'Hozho II',
      client: 'Desert Sound', 
      date: '2024-10-04',
      shortDescription: 'Hozho, Dish Dash, Misha Saied, Leigh Ross, Midway',
      location: { country: 'Saudi Arabia', city: 'Riyadh' },
      categories: ['Digital Art and Visuals'],
      mediaType: 'video'
    },
    {
      uid: 'bulgari-campaign-shoot',
      name: 'Bulgari',
      client: 'Bulgari',
      date: '2024-09-09', 
      shortDescription: 'Projection Mapping for Bulgari\'s New Campaign',
      location: { country: 'Saudi Arabia', city: 'Riyadh' },
      categories: ['3D Mapping', 'Digital Art and Visuals', 'Creative Direction'],
      mediaType: 'video'
    },
  ]

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
          {mockProjects.map((project, index) => (
            <div
              key={project.uid}
              className="group bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:bg-black/50 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Project Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-700 to-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    {project.mediaType === 'video' ? (
                      <div className="w-8 h-8 text-white text-center">🎬</div>
                    ) : (
                      <div className="w-8 h-8 text-white text-center">🖼️</div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-2">
                    <a href={`/projects/${project.uid}/edit`} className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors">
                      ✏️
                    </a>
                    <a href={`http://localhost:8002/work/${project.uid}.html`} target="_blank" className="p-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors">
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
                  <span>{project.location.city}, {project.location.country}</span>
                  <span>{new Date(project.date).toLocaleDateString()}</span>
                </div>
                
                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {project.categories.slice(0, 2).map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-white/10 text-white text-xs rounded-lg"
                    >
                      {category}
                    </span>
                  ))}
                  {project.categories.length > 2 && (
                    <span className="px-2 py-1 bg-white/10 text-white text-xs rounded-lg">
                      +{project.categories.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
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