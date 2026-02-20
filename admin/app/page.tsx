'use client'

import { useState, useEffect } from 'react'

const PREVIEW_BASE = process.env.NEXT_PUBLIC_PREVIEW_URL || 'http://localhost:8000'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalProjects: 0, publishedProjects: 0, draftProjects: 0, totalMediaBlocks: 0 })

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { if (data.stats) setStats(data.stats) })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-xl">JL</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold">Jordan Lago Media Admin</h1>
              <p className="text-gray-300">Portfolio Management System</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Projects" value={stats.totalProjects} />
            <StatCard label="Published" value={stats.publishedProjects} />
            <StatCard label="Drafts" value={stats.draftProjects} />
            <StatCard label="Media Blocks" value={stats.totalMediaBlocks} />
          </div>

          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/projects/new" className="block bg-blue-500 hover:bg-blue-600 rounded-xl p-6 text-center transition-all transform hover:scale-105">
              <div className="text-xl font-semibold mb-2">+ Add New Project</div>
              <div className="text-sm opacity-90">Create a new portfolio project</div>
            </a>
            <a href="/projects" className="block bg-purple-500 hover:bg-purple-600 rounded-xl p-6 text-center transition-all transform hover:scale-105">
              <div className="text-xl font-semibold mb-2">Manage Projects</div>
              <div className="text-sm opacity-90">Edit existing projects</div>
            </a>
            <a href={PREVIEW_BASE} target="_blank" className="block bg-orange-500 hover:bg-orange-600 rounded-xl p-6 text-center transition-all transform hover:scale-105">
              <div className="text-xl font-semibold mb-2">Preview Site</div>
              <div className="text-sm opacity-90">View your live website</div>
            </a>
            <button onClick={async () => {
              try {
                const res = await fetch('/api/generate-site', { method: 'POST' })
                if (!res.ok) throw new Error()
                alert('Static site regenerated successfully!')
              } catch { alert('Failed to regenerate site') }
            }} className="block bg-green-500 hover:bg-green-600 rounded-xl p-6 text-center transition-all transform hover:scale-105 w-full">
              <div className="text-xl font-semibold mb-2">Regenerate Site</div>
              <div className="text-sm opacity-90">Rebuild all static pages</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/10 rounded-xl p-6 text-center">
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}
