'use client'

import { useState, useEffect } from 'react'

interface EditProjectPageProps {
  params: {
    uid: string
  }
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'jlago'
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'portfolio_preset'
  const [isUploadingHero, setIsUploadingHero] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [isUploadingBTS, setIsUploadingBTS] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    date: '',
    shortDescription: '',
    description: '',
    country: '',
    city: '',
    categories: [] as string[]
  })

  // Load project data from API
  useEffect(() => {
    const loadProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.uid}`)
        if (response.ok) {
          const data = await response.json()
          console.log('📂 Loaded project data:', data)
          const projectData = data.project || data
          setProject(projectData)
          
          // Initialize form data with loaded project data
          setFormData({
            name: projectData.name || '',
            client: projectData.client || '',
            date: projectData.date || '',
            shortDescription: projectData.shortDescription || '',
            description: projectData.description || '',
            country: projectData.country || '',
            city: projectData.city || '',
            categories: projectData.categories || []
          })
        } else {
          console.log('📝 Project not found, using mock data')
          // Fall back to mock data if project doesn't exist in DB
          const mockData = mockProjects[params.uid] || mockProjects['default']
          setProject(mockData)
          setFormData({
            name: mockData.name || '',
            client: mockData.client || '',
            date: mockData.date || '',
            shortDescription: mockData.shortDescription || '',
            description: mockData.description || '',
            country: mockData.country || '',
            city: mockData.city || '',
            categories: mockData.categories || []
          })
        }
      } catch (error) {
        console.error('❌ Error loading project:', error)
        // Fall back to mock data on error
        const mockData = mockProjects[params.uid] || mockProjects['default']
        setProject(mockData)
        setFormData({
          name: mockData.name || '',
          client: mockData.client || '',
          date: mockData.date || '',
          shortDescription: mockData.shortDescription || '',
          description: mockData.description || '',
          country: mockData.country || '',
          city: mockData.city || '',
          categories: mockData.categories || []
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [params.uid])

  // Mock project data based on the UID
  const mockProjects: Record<string, any> = {
    'shkoon-msrahiya-album-tour': {
      name: 'Shkoon | Msrahiya Album Tour',
      client: 'Meiosis',
      date: '2023-12-01',
      shortDescription: 'Msrahiya Album Tour',
      description: 'Commissioned by Meiosis in 2023, the Msrahiya tour marked a powerful moment in Shkoon\'s evolution on stage. Built around themes of activism, freedom, and defiance against corruption, the performance became more than a concert. It became a statement.',
      country: 'Tour',
      city: 'World',
      categories: ['Content Development', 'Digital Art and Visuals', 'Creative Direction'],
      mainMediaType: 'video',
      mainMediaUrl: 'https://d2csodhem33bqt.cloudfront.net/uploads/Shkoon_Msrahiya_Album_Tour_Web_Cover_V2_86facc4f7f.mp4'
    },
    'hozho_2': {
      name: 'Hozho II',
      client: 'Desert Sound',
      date: '2024-10-04',
      shortDescription: 'Hozho, Dish Dash, Misha Saied, Leigh Ross, Midway',
      description: 'For this edition of Desert Sound, LO2S provided live visual operation and real-time TouchDesigner integration for Hozho\'s performance.',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      categories: ['Digital Art and Visuals'],
      mainMediaType: 'video',
      mainMediaUrl: 'https://d2csodhem33bqt.cloudfront.net/uploads/Desert_Sound_x_HOZHO_II_Aftermovie_1080p_preset_4cd1478efd.mp4'
    },
    'bulgari-campaign-shoot': {
      name: 'Bulgari',
      client: 'Bulgari',
      date: '2024-09-09',
      shortDescription: 'Projection Mapping for Bulgari\'s New Campaign',
      description: 'For Bulgari\'s latest campaign, we provided 3D mapping solutions to enhance the visual storytelling of their new necklace collection.',
      country: 'Saudi Arabia',
      city: 'Riyadh',
      categories: ['3D Mapping', 'Digital Art and Visuals', 'Creative Direction'],
      mainMediaType: 'video',
      mainMediaUrl: 'https://d2csodhem33bqt.cloudfront.net/uploads/Bulgari_Shoot_2_1_1080p_preset_795d590d0f.mp4'
    },
    'default': {
      name: 'New Project',
      client: '',
      date: new Date().toISOString().split('T')[0],
      shortDescription: '',
      description: '',
      country: '',
      city: '',
      categories: [],
      mainMediaType: 'video',
      mainMediaUrl: ''
    }
  }

  // Show loading state if project is not loaded yet
  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a href="/projects" className="text-white hover:text-gray-300">← Back to Projects</a>
              <div>
                <h1 className="text-2xl font-bold text-white">Edit Project</h1>
                <p className="text-sm text-gray-400">{project.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <a 
                href={`http://localhost:8002/work/${params.uid}.html`} 
                target="_blank"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors"
              >
                👁️ Preview Live
              </a>
              <button 
                onClick={async () => {
                  setIsSaving(true)
                  
                  const saveData = {
                    name: formData.name,
                    client: formData.client,
                    date: formData.date,
                    shortDescription: formData.shortDescription,
                    description: formData.description,
                    country: formData.country,
                    city: formData.city,
                        categories: formData.categories,
                        mainMediaType: project.mainMediaType,
                        mainMediaUrl: project.mainMediaUrl
                  }
                  
                  
                  try {
                    const response = await fetch(`/api/projects/${params.uid}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(saveData)
                    })
                    
                    if (response.ok) {
                      alert('✅ Project saved successfully!')
                    } else {
                      throw new Error('Save failed')
                    }
                  } catch (error) {
                    console.error('❌ Save failed:', error)
                    alert('❌ Failed to save project')
                  } finally {
                    setIsSaving(false)
                  }
                }}
                disabled={isSaving}
                className="bg-white text-black px-6 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
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
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                        value={formData.client}
                        onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                      value={formData.shortDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
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
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
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
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* Media Management */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📱 Project Media</h3>
                
                {/* Hero/Main Video Section */}
                <div className="space-y-6">
                  <div className="border border-white/20 rounded-xl p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium flex items-center space-x-2">
                        <span>🎬</span>
                        <span>Hero Video</span>
                        <span className="text-xs bg-purple-500/30 px-2 py-1 rounded">MAIN</span>
                      </h4>
                      <span className="text-xs text-gray-400">Shows first on project page</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-black/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Current Hero Video:</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">🎬</span>
                          <span className="text-xs text-gray-300 font-mono break-all">
                            {project.mainMediaUrl || 'No hero video set'}
                          </span>
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        id="hero-video-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          
                          console.log('🎬 Original file name:', file.name)
                          console.log('🎬 File size:', file.size)
                          console.log('🎬 File type:', file.type)
                          
                          setIsUploadingHero(true)
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            formData.append('upload_preset', UPLOAD_PRESET)
                            formData.append('folder', `portfolio/${params.uid}/hero`)

                            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
                              method: 'POST',
                              body: formData,
                            })

                            if (response.ok) {
                              const data = await response.json()
                              
                              console.log('🎬 CLOUDINARY RESPONSE:')
                              console.log('- secure_url:', data.secure_url)
                              console.log('- public_id:', data.public_id)
                              console.log('- original_filename:', data.original_filename)
                              
                              console.log('🎬 BEFORE updating project state - current mainMediaUrl:', project.mainMediaUrl)
                              
                              // Update project state with new hero video URL
                              setProject(prev => ({ ...prev, mainMediaUrl: data.secure_url }))

                              // Persist immediately so static generation can use it
                              try {
                                await fetch(`/api/projects/${params.uid}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    name: formData.name,
                                    client: formData.client,
                                    date: formData.date,
                                    shortDescription: formData.shortDescription,
                                    description: formData.description,
                                    country: formData.country,
                                    city: formData.city,
                                    categories: formData.categories,
                                    mainMediaType: 'video',
                                    mainMediaUrl: data.secure_url
                                  })
                                })
                              } catch (e) {
                                console.error('❌ Failed to persist hero URL after upload', e)
                              }

                              alert(`✅ Hero video uploaded and saved!`)
                            } else {
                              const errorText = await response.text()
                              console.error('❌ Cloudinary error response:', errorText)
                              throw new Error('Upload failed')
                            }
                          } catch (error) {
                            console.error('❌ Upload failed:', error)
                            alert('❌ Upload failed. Check Cloudinary settings.')
                          } finally {
                            setIsUploadingHero(false)
                          }
                        }}
                      />
                      <label 
                        htmlFor="hero-video-upload"
                        className={`block w-full py-3 rounded-lg text-center font-medium transition-colors cursor-pointer ${
                          isUploadingHero 
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                            : 'bg-purple-500 hover:bg-purple-600 text-white'
                        }`}
                      >
                        {isUploadingHero ? '⏳ Uploading...' : '🎬 Replace Hero Video'}
                      </label>
                    </div>
                    
                  </div>

                  {/* Gallery Images Section */}
                  <div className="border border-white/20 rounded-xl p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium flex items-center space-x-2">
                        <span>🖼️</span>
                        <span>Project Gallery</span>
                        <span className="text-xs bg-blue-500/30 px-2 py-1 rounded">GALLERY</span>
                      </h4>
                      <span className="text-xs text-gray-400">Shows below hero video</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-black/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-2">Gallery Images:</p>
                        <div className="text-xs text-gray-500">
                          📝 Gallery images will be managed in a future update. For now, hero video is the main focus.
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        id="gallery-images-upload"
                        onChange={async (e) => {
                          const files = e.target.files
                          if (!files || files.length === 0) return
                          
                          setIsUploadingGallery(true)
                          try {
                            const uploadedUrls = []
                            for (const file of Array.from(files)) {
                              const formData = new FormData()
                              formData.append('file', file)
                              formData.append('upload_preset', UPLOAD_PRESET)
                              formData.append('folder', `portfolio/${params.uid}/gallery`)

                              const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                                method: 'POST',
                                body: formData,
                              })

                              if (response.ok) {
                                const data = await response.json()
                                uploadedUrls.push(data.secure_url)
                                console.log('✅ Gallery image uploaded:', data.secure_url)
                              } else {
                                throw new Error('Upload failed')
                              }
                            }
                            alert(`✅ ${uploadedUrls.length} gallery images uploaded! These will appear in your project gallery.`)
                          } catch (error) {
                            console.error('❌ Upload failed:', error)
                            alert('❌ Upload failed. Check Cloudinary settings.')
                          } finally {
                            setIsUploadingGallery(false)
                          }
                        }}
                      />
                      <label 
                        htmlFor="gallery-images-upload"
                        className={`block w-full py-3 rounded-lg text-center font-medium transition-colors cursor-pointer ${
                          isUploadingGallery 
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isUploadingGallery ? '⏳ Uploading...' : '🖼️ Add Gallery Images'}
                      </label>
                    </div>
                  </div>

                  {/* Behind the Scenes Section */}
                  <div className="border border-white/20 rounded-xl p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium flex items-center space-x-2">
                        <span>🎥</span>
                        <span>Behind the Scenes</span>
                        <span className="text-xs bg-green-500/30 px-2 py-1 rounded">EXTRA</span>
                      </h4>
                      <span className="text-xs text-gray-400">Process videos & BTS content</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-black/30 rounded-lg">
                        <p className="text-xs text-gray-400 mb-2">BTS Content:</p>
                        <div className="text-xs text-gray-500">
                          📝 Behind-the-scenes content will be managed in a future update.
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        multiple
                        accept="video/*,image/*"
                        className="hidden"
                        id="bts-upload"
                        onChange={async (e) => {
                          const files = e.target.files
                          if (!files || files.length === 0) return
                          
                          setIsUploadingBTS(true)
                          try {
                            const uploadedUrls = []
                            for (const file of Array.from(files)) {
                              const formData = new FormData()
                              formData.append('file', file)
                              formData.append('upload_preset', UPLOAD_PRESET)
                              formData.append('folder', `portfolio/${params.uid}/bts`)

                              const endpoint = file.type.startsWith('video') ? 'video' : 'image'
                              const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`, {
                                method: 'POST',
                                body: formData,
                              })

                              if (response.ok) {
                                const data = await response.json()
                                uploadedUrls.push(data.secure_url)
                                console.log('✅ BTS content uploaded:', data.secure_url)
                              } else {
                                throw new Error('Upload failed')
                              }
                            }
                            alert(`✅ ${uploadedUrls.length} BTS files uploaded! These are stored for future use.`)
                          } catch (error) {
                            console.error('❌ Upload failed:', error)
                            alert('❌ Upload failed. Check Cloudinary settings.')
                          } finally {
                            setIsUploadingBTS(false)
                          }
                        }}
                      />
                      <label 
                        htmlFor="bts-upload"
                        className={`block w-full py-3 rounded-lg text-center font-medium transition-colors cursor-pointer ${
                          isUploadingBTS 
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {isUploadingBTS ? '⏳ Uploading...' : '🎥 Add BTS Content'}
                      </label>
                    </div>
                  </div>

                  {/* Upload Guidelines */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
                      <span>💡</span>
                      <span>Upload Guidelines</span>
                    </h4>
                    <div className="space-y-2 text-xs text-gray-400">
                      <div className="flex items-start space-x-2">
                        <span className="text-purple-400">🎬</span>
                        <span><strong>Hero Video:</strong> Main video that plays first on your project page (MP4, max 100MB)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-400">🖼️</span>
                        <span><strong>Gallery Images:</strong> High-res images shown in project gallery (JPG/PNG/WebP, max 50MB each)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-green-400">🎥</span>
                        <span><strong>BTS Content:</strong> Behind-the-scenes videos and images for future use</span>
                      </div>
                    </div>
                  </div>
                </div>
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
                        checked={formData.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, categories: [...prev.categories, category] }))
                          } else {
                            setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }))
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-black/40"
                      />
                      <span className="text-white text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-3">
                  <a 
                    href={`http://localhost:8002/work/${params.uid}.html`}
                    target="_blank" 
                    className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-center font-medium transition-colors"
                  >
                    👁️ Preview Live Site
                  </a>
                  <button
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/generate-site', { method: 'POST' })
                        if (!res.ok) throw new Error('Generate failed')
                        alert('✅ Static site regenerated. Refresh the project page to see updates.')
                      } catch (e) {
                        console.error('❌ Generate failed', e)
                        alert('❌ Failed to regenerate static page')
                      }
                    }}
                  >
                    🔄 Regenerate Static Page
                  </button>
                  <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-medium transition-colors">
                    📋 Duplicate Project
                  </button>
                  <button className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors">
                    🗑️ Delete Project
                  </button>
                </div>
              </div>

              {/* Project Stats */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Project Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">2 months ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-white">1 week ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">Published</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Slug:</span>
                    <span className="text-blue-400 font-mono">{params.uid}</span>
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
