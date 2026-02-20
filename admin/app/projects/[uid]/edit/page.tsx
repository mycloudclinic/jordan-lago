'use client'

import { useState, useEffect } from 'react'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'jlago'
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'portfolio_preset'
const PREVIEW_BASE = process.env.NEXT_PUBLIC_PREVIEW_URL || 'http://localhost:8000'

const CATEGORIES = [
  '3D Mapping', 'Creative Direction', 'Content Development',
  'Digital Art and Visuals', 'Lighting Design',
  'Scenography & Stage Design', 'Technical Management'
]

// The three layout types the LO2S front-end supports
const BLOCK_TYPES = [
  { value: 'full-size', label: 'Full Size (1 image/video)' },
  { value: 'two-media', label: 'Two Media (left + right)' },
  { value: 'three-media', label: 'Three Media (left + middle + right)' },
]

interface MediaBlock {
  type: string
  order: number
  leftMediaUrl: string | null
  leftMediaType: string | null
  rightMediaUrl: string | null
  rightMediaType: string | null
  middleMediaUrl: string | null
  middleMediaType: string | null
}

interface EditProjectPageProps {
  params: { uid: string }
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [slug, setSlug] = useState(params.uid)
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([])
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '', client: '', date: '', shortDescription: '',
    description: '', country: '', city: '',
    published: false, categories: [] as string[]
  })

  // Load project data from API
  useEffect(() => {
    const loadProject = async () => {
      try {
        const res = await fetch(`/api/projects/${params.uid}`)
        if (!res.ok) { setNotFound(true); setIsLoading(false); return }
        const data = await res.json()
        const p = data.project || data
        setProject(p)
        setSlug(params.uid)
        setFormData({
          name: p.name || '', client: p.client || '', date: p.date || '',
          shortDescription: p.shortDescription || '', description: p.description || '',
          country: p.country || '', city: p.city || '',
          published: p.published ?? false,
          categories: p.categories || []
        })
        // Load existing media blocks
        if (p.mediaBlocks && Array.isArray(p.mediaBlocks)) {
          setMediaBlocks(p.mediaBlocks.map((b: any, i: number) => ({
            type: b.type || 'full-size',
            order: b.order ?? i,
            leftMediaUrl: b.leftMediaUrl || null,
            leftMediaType: b.leftMediaType || null,
            rightMediaUrl: b.rightMediaUrl || null,
            rightMediaType: b.rightMediaType || null,
            middleMediaUrl: b.middleMediaUrl || null,
            middleMediaType: b.middleMediaType || null,
          })))
        }
      } catch (error) {
        console.error('Error loading project:', error)
        setNotFound(true)
      } finally {
        setIsLoading(false)
      }
    }
    loadProject()
  }, [params.uid])

  // Upload a file to Cloudinary, returns the secure_url
  async function uploadToCloudinary(file: File, folder: string): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', UPLOAD_PRESET)
    fd.append('folder', folder)
    const endpoint = file.type.startsWith('video') ? 'video' : 'image'
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`, {
      method: 'POST', body: fd
    })
    if (!res.ok) throw new Error('Cloudinary upload failed')
    const data = await res.json()
    return data.secure_url
  }

  // Upload handler for a specific media block slot
  async function handleBlockUpload(blockIndex: number, slot: 'left' | 'right' | 'middle' | 'media', file: File) {
    const slotKey = `${blockIndex}-${slot}`
    setUploadingSlot(slotKey)
    try {
      const url = await uploadToCloudinary(file, `portfolio/${params.uid}/gallery`)
      const mediaType = file.type.startsWith('video') ? 'video' : 'image'
      setMediaBlocks(prev => {
        const updated = [...prev]
        const block = { ...updated[blockIndex] }
        // For full-size blocks, "media" maps to middleMediaUrl
        if (slot === 'media' || slot === 'middle') {
          block.middleMediaUrl = url
          block.middleMediaType = mediaType
        } else if (slot === 'left') {
          block.leftMediaUrl = url
          block.leftMediaType = mediaType
        } else if (slot === 'right') {
          block.rightMediaUrl = url
          block.rightMediaType = mediaType
        }
        updated[blockIndex] = block
        return updated
      })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Check Cloudinary settings.')
    } finally {
      setUploadingSlot(null)
    }
  }

  // Save all project data including media blocks
  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/projects/${params.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          mainMediaType: project.mainMediaType,
          mainMediaUrl: project.mainMediaUrl,
          mainVideoUrl: project.mainVideoUrl,
          previousUid: params.uid,
          uid: slug,
          mediaBlocks: mediaBlocks.map((b, i) => ({ ...b, order: i }))
        })
      })
      if (res.ok) {
        alert('Project saved successfully!')
        if (slug !== params.uid) window.location.href = `/projects/${slug}/edit`
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  // Hero video upload
  async function handleHeroUpload(file: File) {
    setUploadingSlot('hero')
    try {
      const url = await uploadToCloudinary(file, `portfolio/${params.uid}/hero`)
      setProject((prev: any) => ({ ...prev, mainMediaUrl: url, mainMediaType: 'video' }))
      // Persist immediately
      await fetch(`/api/projects/${params.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainMediaType: 'video', mainMediaUrl: url })
      })
      alert('Hero video uploaded and saved!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Check Cloudinary settings.')
    } finally {
      setUploadingSlot(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4" />
          <p>Loading project...</p>
        </div>
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Project Not Found</h2>
          <p className="text-gray-400 mb-6">No project with slug &quot;{params.uid}&quot; exists in the database.</p>
          <a href="/projects" className="bg-white text-black px-6 py-3 rounded-xl font-medium">Back to Projects</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/projects" className="text-white hover:text-gray-300">Back</a>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Project</h1>
              <p className="text-sm text-gray-400">{formData.name || params.uid}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a href={`${PREVIEW_BASE}/work/${params.uid}.html`} target="_blank"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors">
              Preview
            </a>
            <button onClick={handleSave} disabled={isSaving}
              className="bg-white text-black px-6 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              <div className="space-y-4">
                <FormField label="Project Name *" value={formData.name} onChange={v => setFormData(p => ({ ...p, name: v }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Slug (URL)</label>
                  <input type="text" value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-\s]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-'))}
                    placeholder="my-project-slug"
                    className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Client *" value={formData.client} onChange={v => setFormData(p => ({ ...p, client: v }))} />
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white focus:border-white/40 focus:outline-none" />
                  </div>
                </div>
                <FormField label="Short Description *" value={formData.shortDescription} onChange={v => setFormData(p => ({ ...p, shortDescription: v }))} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Country *" value={formData.country} onChange={v => setFormData(p => ({ ...p, country: v }))} />
                  <FormField label="City *" value={formData.city} onChange={v => setFormData(p => ({ ...p, city: v }))} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Description</h3>
              <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={6} className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white focus:border-white/40 focus:outline-none resize-none" />
              <p className="text-xs text-gray-500 mt-2">Separate paragraphs with blank lines.</p>
            </div>

            {/* Hero Media */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Hero Video</h3>
              <div className="p-3 bg-black/30 rounded-lg mb-3">
                <p className="text-xs text-gray-400 mb-1">Current:</p>
                <p className="text-xs text-gray-300 font-mono break-all">{project.mainMediaUrl || 'No hero video set'}</p>
              </div>
              <input type="file" accept="video/*" className="hidden" id="hero-upload"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroUpload(f) }} />
              <label htmlFor="hero-upload"
                className={`block w-full py-3 rounded-lg text-center font-medium cursor-pointer transition-colors ${uploadingSlot === 'hero' ? 'bg-gray-500 text-gray-300' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
                {uploadingSlot === 'hero' ? 'Uploading...' : 'Replace Hero Video'}
              </label>
            </div>

            {/* Media Blocks (Gallery) */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Gallery Blocks</h3>
                <button onClick={() => setMediaBlocks(prev => [...prev, {
                  type: 'full-size', order: prev.length,
                  leftMediaUrl: null, leftMediaType: null,
                  rightMediaUrl: null, rightMediaType: null,
                  middleMediaUrl: null, middleMediaType: null,
                }])}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  + Add Block
                </button>
              </div>

              {mediaBlocks.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">No gallery blocks yet. Add one to start building your project gallery.</p>
              )}

              <div className="space-y-4">
                {mediaBlocks.map((block, i) => (
                  <div key={i} className="border border-white/10 rounded-xl p-4 bg-black/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium text-sm">Block {i + 1}</span>
                        <select value={block.type}
                          onChange={e => setMediaBlocks(prev => {
                            const u = [...prev]; u[i] = { ...u[i], type: e.target.value }; return u
                          })}
                          className="bg-black/40 border border-white/20 rounded-lg px-3 py-1 text-white text-sm">
                          {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        {i > 0 && (
                          <button onClick={() => setMediaBlocks(prev => {
                            const u = [...prev]; [u[i-1], u[i]] = [u[i], u[i-1]]; return u
                          })} className="text-gray-400 hover:text-white text-sm px-2">Up</button>
                        )}
                        {i < mediaBlocks.length - 1 && (
                          <button onClick={() => setMediaBlocks(prev => {
                            const u = [...prev]; [u[i], u[i+1]] = [u[i+1], u[i]]; return u
                          })} className="text-gray-400 hover:text-white text-sm px-2">Down</button>
                        )}
                        <button onClick={() => setMediaBlocks(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-300 text-sm px-2">Remove</button>
                      </div>
                    </div>

                    {/* Upload slots based on block type */}
                    <div className={`grid gap-3 ${block.type === 'full-size' ? 'grid-cols-1' : block.type === 'two-media' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {block.type === 'full-size' && (
                        <MediaSlot label="Media" url={block.middleMediaUrl || block.leftMediaUrl} mediaType={block.middleMediaType || block.leftMediaType}
                          uploading={uploadingSlot === `${i}-media`}
                          onUpload={f => handleBlockUpload(i, 'media', f)} />
                      )}
                      {(block.type === 'two-media' || block.type === 'three-media') && (
                        <>
                          <MediaSlot label="Left" url={block.leftMediaUrl} mediaType={block.leftMediaType}
                            uploading={uploadingSlot === `${i}-left`}
                            onUpload={f => handleBlockUpload(i, 'left', f)} />
                          {block.type === 'three-media' && (
                            <MediaSlot label="Middle" url={block.middleMediaUrl} mediaType={block.middleMediaType}
                              uploading={uploadingSlot === `${i}-middle`}
                              onUpload={f => handleBlockUpload(i, 'middle', f)} />
                          )}
                          <MediaSlot label="Right" url={block.rightMediaUrl} mediaType={block.rightMediaType}
                            uploading={uploadingSlot === `${i}-right`}
                            onUpload={f => handleBlockUpload(i, 'right', f)} />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={formData.categories.includes(cat)}
                      onChange={e => setFormData(p => ({
                        ...p, categories: e.target.checked
                          ? [...p.categories, cat]
                          : p.categories.filter(c => c !== cat)
                      }))}
                      className="w-4 h-4 rounded border-white/20 bg-black/40" />
                    <span className="text-white text-sm">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <a href={`${PREVIEW_BASE}/work/${params.uid}.html`} target="_blank"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl text-center font-medium transition-colors">
                  Preview Live Site
                </a>
                <button onClick={async () => {
                  try {
                    const res = await fetch('/api/generate-site', { method: 'POST' })
                    if (!res.ok) throw new Error()
                    alert('Static site regenerated!')
                  } catch { alert('Failed to regenerate') }
                }} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors">
                  Regenerate Static Page
                </button>
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Info</h3>
              <div className="space-y-3 text-sm">
                {project.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
                {project.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Updated:</span>
                    <span className="text-white">{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={formData.published}
                      onChange={e => setFormData(p => ({ ...p, published: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-black/40 text-green-500" />
                    <div>
                      <span className="text-white font-medium">Published</span>
                      <p className="text-xs text-gray-400">Show on website</p>
                    </div>
                  </label>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Slug:</span>
                  <span className="text-blue-400 font-mono text-xs">{params.uid}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function FormField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-black/40 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:border-white/40 focus:outline-none transition-colors" />
    </div>
  )
}

function MediaSlot({ label, url, mediaType, uploading, onUpload }: {
  label: string; url: string | null; mediaType: string | null
  uploading: boolean; onUpload: (f: File) => void
}) {
  const inputId = `upload-${label}-${Math.random().toString(36).slice(2)}`
  return (
    <div className="bg-black/30 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {url ? (
        <div className="mb-2">
          {mediaType === 'video' ? (
            <video src={url} className="w-full h-24 object-cover rounded" muted playsInline preload="metadata" />
          ) : (
            <img src={url} alt={label} className="w-full h-24 object-cover rounded" />
          )}
          <p className="text-xs text-gray-500 font-mono mt-1 truncate">{url.split('/').pop()}</p>
        </div>
      ) : (
        <div className="h-24 bg-white/5 rounded flex items-center justify-center mb-2">
          <span className="text-gray-600 text-xs">No media</span>
        </div>
      )}
      <input type="file" accept="image/*,video/*" className="hidden" id={inputId}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
      <label htmlFor={inputId}
        className={`block w-full py-2 rounded text-center text-xs font-medium cursor-pointer transition-colors ${uploading ? 'bg-gray-600 text-gray-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
        {uploading ? 'Uploading...' : url ? 'Replace' : 'Upload'}
      </label>
    </div>
  )
}
