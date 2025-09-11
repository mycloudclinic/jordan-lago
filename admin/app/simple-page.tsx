export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">LO2S Admin</h1>
          <p className="text-gray-300 mb-8">Portfolio Management System</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">18</div>
              <div className="text-sm text-gray-400">Projects</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">140</div>
              <div className="text-sm text-gray-400">Images</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">21</div>
              <div className="text-sm text-gray-400">Videos</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">25</div>
              <div className="text-sm text-gray-400">Clients</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/projects/new" className="block bg-blue-500 hover:bg-blue-600 rounded-xl p-6 text-center transition-colors">
              <div className="text-lg font-semibold">Add New Project</div>
              <div className="text-sm opacity-80">Create a new portfolio project</div>
            </a>
            <a href="/media/upload" className="block bg-green-500 hover:bg-green-600 rounded-xl p-6 text-center transition-colors">
              <div className="text-lg font-semibold">Upload Media</div>
              <div className="text-sm opacity-80">Add images and videos</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
