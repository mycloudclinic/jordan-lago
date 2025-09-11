export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/projects" className="text-white hover:text-gray-300">← Back</a>
              <div>
                <h1 className="text-2xl font-bold text-white">New Project</h1>
                <p className="text-sm text-gray-400">Add a new portfolio project</p>
              </div>
            </div>
            <button className="bg-white text-black px-6 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors">
              💾 Save Project
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Shkoon | Msrahiya Album Tour"
                      className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Client *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Meiosis"
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white focus:border-white/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Short Description *
                    </label>
                    <input
                      type="text"
                      placeholder="Brief description for project cards"
                      className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Saudi Arabia"
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Riyadh"
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Project Description</h3>
                <textarea
                  placeholder="Detailed description of the project..."
                  rows={8}
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Categories */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
                <div className="space-y-2">
                  {[
                    '3D Mapping',
                    'Creative Direction', 
                    'Content Development',
                    'Digital Art and Visuals',
                    'Lighting Design',
                    'Scenography & Stage Design',
                    'Technical Management'
                  ].map((category) => (
                    <label key={category} className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-white/20 bg-black/40 text-white focus:ring-white/20"
                      />
                      <span className="text-white text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Main Media */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Main Media</h3>
                
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-white text-black py-2 rounded-lg font-medium">
                      🎬 Video
                    </button>
                    <button className="flex-1 bg-white/20 text-white py-2 rounded-lg font-medium hover:bg-white/30">
                      🖼️ Image
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cloudinary URL *
                    </label>
                    <input
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <a href="/media/upload" className="block w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-center font-medium transition-colors">
                    📤 Upload New Media
                  </a>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📹</div>
                    <p className="text-sm text-gray-400">No media selected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}