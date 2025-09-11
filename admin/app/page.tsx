export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-xl">L</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold">LAGO Admin</h1>
              <p className="text-gray-300">Portfolio Management System</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold mb-2">18</div>
              <div className="text-sm text-gray-400">Projects</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold mb-2">140</div>
              <div className="text-sm text-gray-400">Images</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold mb-2">21</div>
              <div className="text-sm text-gray-400">Videos</div>
            </div>
            <div className="bg-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold mb-2">25</div>
              <div className="text-sm text-gray-400">Clients</div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/projects/new" className="block bg-blue-500 hover:bg-blue-600 rounded-xl p-6 text-center transition-all transform hover:scale-105">
              <div className="text-xl font-semibold mb-2">+ Add New Project</div>
              <div className="text-sm opacity-90">Create a new portfolio project</div>
            </a>
            <a href="/media/upload" className="block bg-green-500 hover:bg-green-600 rounded-xl p-6 text-center transition-all transform hover:scale-105">
              <div className="text-xl font-semibold mb-2">📤 Upload Media</div>
              <div className="text-sm opacity-90">Add images and videos to Cloudinary</div>
            </a>
            <a href="/projects" className="block bg-purple-500 hover:bg-purple-600 rounded-xl p-6 text-center transition-all transform hover:scale-105">
              <div className="text-xl font-semibold mb-2">📊 Manage Projects</div>
              <div className="text-sm opacity-90">Edit existing projects</div>
            </a>
            <a href="http://localhost:8002" target="_blank" className="block bg-orange-500 hover:bg-orange-600 rounded-xl p-6 text-center transition-all transform hover:scale-105">
              <div className="text-xl font-semibold mb-2">👁️ Preview Site</div>
              <div className="text-sm opacity-90">View your live website</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
