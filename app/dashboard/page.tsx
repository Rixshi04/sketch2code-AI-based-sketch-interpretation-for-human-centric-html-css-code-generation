'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Share2, 
  Download, 
  Edit, 
  Trash2,
  Eye,
  Sparkles,
  Clock,
  Users,
  Star,
  TrendingUp,
  Palette,
  Smartphone,
  Monitor,
  Globe,
  Zap,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  platform: string
  thumbnail: string
  lastModified: string
  status: 'draft' | 'completed' | 'archived'
  shared: boolean
  views: number
  likes: number
}

interface Template {
  id: string
  name: string
  category: string
  platform: string
  thumbnail: string
  rating: number
  downloads: number
  isPremium: boolean
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const projects: Project[] = [
    {
      id: '1',
      name: 'E-commerce Landing Page',
      platform: 'react',
      thumbnail: '/api/placeholder/300/200',
      lastModified: '2 hours ago',
      status: 'completed',
      shared: true,
      views: 156,
      likes: 23
    },
    {
      id: '2',
      name: 'Mobile App Dashboard',
      platform: 'flutter',
      thumbnail: '/api/placeholder/300/200',
      lastModified: '1 day ago',
      status: 'draft',
      shared: false,
      views: 89,
      likes: 12
    },
    {
      id: '3',
      name: 'Admin Panel Interface',
      platform: 'vue',
      thumbnail: '/api/placeholder/300/200',
      lastModified: '3 days ago',
      status: 'completed',
      shared: true,
      views: 234,
      likes: 45
    }
  ]

  const templates: Template[] = [
    {
      id: '1',
      name: 'Modern Landing Page',
      category: 'Marketing',
      platform: 'react',
      thumbnail: '/api/placeholder/300/200',
      rating: 4.8,
      downloads: 1234,
      isPremium: false
    },
    {
      id: '2',
      name: 'E-commerce Store',
      category: 'Business',
      platform: 'vue',
      thumbnail: '/api/placeholder/300/200',
      rating: 4.9,
      downloads: 2156,
      isPremium: true
    },
    {
      id: '3',
      name: 'Mobile Banking App',
      category: 'Finance',
      platform: 'flutter',
      thumbnail: '/api/placeholder/300/200',
      rating: 4.7,
      downloads: 987,
      isPremium: false
    }
  ]

  const stats = [
    { label: 'Total Projects', value: '24', icon: Palette, change: '+12%' },
    { label: 'Code Generated', value: '156', icon: Sparkles, change: '+8%' },
    { label: 'Time Saved', value: '48h', icon: Clock, change: '+15%' },
    { label: 'Team Members', value: '8', icon: Users, change: '+2' }
  ]

  const handleShare = (projectId: string) => {
    const shareUrl = `${window.location.origin}/project/${projectId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Project link copied to clipboard!')
  }

  const handleDelete = (projectId: string) => {
    toast.success('Project deleted successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">SketchMaster</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>{stat.change}</span>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/upload" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <div className="p-2 bg-primary-100 rounded-lg mr-3">
                <Plus className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Upload Sketch</h3>
                <p className="text-sm text-gray-600">Start a new project</p>
              </div>
            </Link>
            
            <Link href="/opencv" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">OpenCV AI</h3>
                <p className="text-sm text-gray-600">Real-time sketch detection</p>
              </div>
            </Link>
            
            <Link href="/templates" className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Templates</h3>
                <p className="text-sm text-gray-600">Use pre-built designs</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Projects</option>
                  <option value="draft">Drafts</option>
                  <option value="completed">Completed</option>
                  <option value="shared">Shared</option>
                </select>
                
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <div className="flex items-center space-x-1">
                          {project.platform === 'react' && <Monitor className="w-4 h-4 text-blue-600" />}
                          {project.platform === 'flutter' && <Smartphone className="w-4 h-4 text-purple-600" />}
                          {project.platform === 'vue' && <Globe className="w-4 h-4 text-green-600" />}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{project.lastModified}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{project.views} views</span>
                          <span>{project.likes} likes</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleShare(project.id)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.lastModified}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShare(project.id)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Templates Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Popular Templates</h2>
              <Link href="/templates" className="text-primary-600 hover:text-primary-700 font-medium">
                View all templates
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-100 relative">
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    {template.isPremium && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Premium
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.category}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">{template.rating}</span>
                      </div>
                      <span className="text-sm text-gray-600">{template.downloads} downloads</span>
                    </div>
                    
                    <button className="w-full btn-primary flex items-center justify-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Use Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 