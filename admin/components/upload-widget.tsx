'use client'

import { useState } from 'react'

interface UploadWidgetProps {
  onUpload?: (url: string) => void
  acceptedTypes?: string
  buttonText?: string
  buttonColor?: string
}

export default function UploadWidget({ 
  onUpload, 
  acceptedTypes = "image/*,video/*",
  buttonText = "📤 Upload Files",
  buttonColor = "bg-green-500 hover:bg-green-600"
}: UploadWidgetProps) {
  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'jlago'
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'lago_preset'
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        // Upload to Cloudinary
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', UPLOAD_PRESET)
        formData.append('folder', 'portfolio')

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${file.type.startsWith('video') ? 'video' : 'image'}/upload`

        const response = await fetch(cloudinaryUrl, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        const uploadedUrl = data.secure_url
        
        setUploadedFiles(prev => [...prev, uploadedUrl])
        
        // Callback with the uploaded URL
        if (onUpload) {
          onUpload(uploadedUrl)
        }

        console.log('✅ Uploaded:', uploadedUrl)
      }
    } catch (error) {
      console.error('❌ Upload failed:', error)
      alert('Upload failed. Please check your Cloudinary settings.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload-widget"
          disabled={isUploading}
        />
        <label 
          htmlFor="file-upload-widget"
          className={`
            inline-block w-full text-white py-3 rounded-xl text-center font-medium transition-colors cursor-pointer
            ${isUploading ? 'bg-gray-500 cursor-not-allowed' : buttonColor}
          `}
        >
          {isUploading ? '⏳ Uploading...' : buttonText}
        </label>
      </div>

      {/* Show uploaded files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Recently Uploaded:</h4>
          {uploadedFiles.map((url, index) => (
            <div key={index} className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-mono truncate">{url}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(url)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cloudinary Setup Instructions */}
      <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
        <h4 className="text-yellow-300 font-medium mb-2">⚠️ Cloudinary Setup Required</h4>
        <p className="text-sm text-yellow-200 mb-2">
          To upload files, you need to create an upload preset in Cloudinary:
        </p>
        <ol className="text-xs text-yellow-200 space-y-1">
          <li>1. Go to <a href="https://cloudinary.com/console/settings/upload" target="_blank" className="underline">Cloudinary Console</a></li>
          <li>2. Create upload preset: <code className="bg-black/20 px-1 rounded">lago_preset</code></li>
          <li>3. Set to "Unsigned" mode</li>
          <li>4. Configure folder: <code className="bg-black/20 px-1 rounded">lago</code></li>
        </ol>
      </div>
    </div>
  )
}
