'use client'

import { useState } from 'react'

export default function MediaUploadPage() {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'jlago'
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'portfolio_preset'
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFileUpload(Array.from(files))
    }
  }

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true)
    
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', UPLOAD_PRESET)
        formData.append('folder', 'portfolio')

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${file.type.startsWith('video') ? 'video' : 'image'}/upload`, {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ File uploaded:', data.secure_url)
          setUploadedFiles(prev => [...prev, data.secure_url])
        } else {
          throw new Error('Upload failed')
        }
      }
      alert(`✅ Successfully uploaded ${files.length} file(s)!`)
    } catch (error) {
      console.error('❌ Upload failed:', error)
      alert('❌ Upload failed. Check Cloudinary settings.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Media Upload</h1>
              <p className="text-sm text-gray-400">Upload images and videos to Cloudinary</p>
            </div>
            <a href="/" className="text-white hover:text-gray-300">← Back</a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Drag & Drop Upload Area */}
        <div className="mb-8">
          <div 
            className={`
              border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
              ${isDragging 
                ? 'border-blue-400 bg-blue-500/10 scale-105' 
                : 'border-white/20 bg-black/20 hover:border-white/40 hover:bg-black/30'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className={`w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform ${isDragging ? 'scale-110 rotate-3' : ''}`}>
              <span className="text-2xl">{isUploading ? '⏳' : '📤'}</span>
            </div>
            
            {isUploading ? (
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Uploading...</h3>
                <p className="text-gray-300">Please wait while files are uploaded to Cloudinary</p>
              </div>
            ) : isDragging ? (
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Drop files here</h3>
                <p className="text-gray-300">Release to upload to Cloudinary</p>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Upload Media Files</h3>
                <p className="text-gray-400 mb-4">
                  Drag & drop images and videos here, or click to browse
                </p>
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>🖼️</span>
                    <span>Images: JPG, PNG, WebP</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🎬</span>
                    <span>Videos: MP4, MOV</span>
                  </div>
                </div>
              </div>
            )}
            
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              id="file-upload"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            
            {!isUploading && !isDragging && (
              <button className="mt-6 bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                Choose Files
              </button>
            )}
          </div>
        </div>

        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Recently Uploaded ({uploadedFiles.length})</h3>
            <div className="space-y-2">
              {uploadedFiles.map((url, index) => (
                <div key={index} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{url.includes('/video/') ? '🎬' : '🖼️'}</span>
                      <span className="text-sm text-gray-300 font-mono truncate max-w-md">{url}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(url)
                        alert('✅ URL copied to clipboard!')
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Copy URL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Tips */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                <span>🖼️</span>
                <span>Images</span>
              </h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• High resolution (min 1920px width)</li>
                <li>• WebP format preferred for web optimization</li>
                <li>• JPG/PNG also supported</li>
                <li>• Max file size: 50MB</li>
                <li>• Auto-resized to 8 different sizes</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
                <span>🎬</span>
                <span>Videos</span>
              </h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• MP4 format recommended</li>
                <li>• 1080p or higher resolution</li>
                <li>• Auto-compressed for web delivery</li>
                <li>• Max file size: 100MB</li>
                <li>• Thumbnails auto-generated</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
            <h4 className="text-blue-300 font-medium mb-2">🔗 Cloudinary Integration</h4>
            <p className="text-sm text-blue-200">
              Files are uploaded to your Cloudinary account defined by <code className="px-1 bg-black/30 rounded">NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}