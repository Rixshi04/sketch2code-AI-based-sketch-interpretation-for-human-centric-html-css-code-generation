'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Eye, 
  Heart,
  Sparkles,
  Monitor,
  Smartphone,
  Globe,
  Zap,
  ArrowLeft,
  Grid,
  List,
  Crown
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  description: string
  category: string
  platform: string
  thumbnail: string
  rating: number
  downloads: number
  isPremium: boolean
  tags: string[]
  author: string
  price?: number
}

const categories = [
  { id: 'all', name: 'All Templates', icon: Grid },
  { id: 'landing', name: 'Landing Pages', icon: Monitor },
  { id: 'ecommerce', name: 'E-commerce', icon: Globe },
  { id: 'dashboard', name: 'Dashboards', icon: Zap },
  { id: 'mobile', name: 'Mobile Apps', icon: Smartphone },
  { id: 'premium', name: 'Premium', icon: Crown }
]

const platforms = [
  { id: 'all', name: 'All Platforms', icon: Grid },
  { id: 'react', name: 'React', icon: Monitor },
  { id: 'vue', name: 'Vue.js', icon: Globe },
  { id: 'angular', name: 'Angular', icon: Zap },
  { id: 'flutter', name: 'Flutter', icon: Smartphone },
  { id: 'swiftui', name: 'SwiftUI', icon: Smartphone }
]

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')

  const templates: Template[] = [
    {
      id: '1',
      name: 'Modern Landing Page',
      description: 'A beautiful, responsive landing page with modern design patterns and animations.',
      category: 'landing',
      platform: 'react',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.8,
      downloads: 1234,
      isPremium: false,
      tags: ['responsive', 'modern', 'landing'],
      author: 'Design Studio'
    },
    {
      id: '2',
      name: 'E-commerce Store',
      description: 'Complete e-commerce solution with product catalog, cart, and checkout.',
      category: 'ecommerce',
      platform: 'vue',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.9,
      downloads: 2156,
      isPremium: true,
      tags: ['ecommerce', 'shopping', 'cart'],
      author: 'Vue Masters',
      price: 29
    },
    {
      id: '3',
      name: 'Admin Dashboard',
      description: 'Professional admin dashboard with charts, tables, and user management.',
      category: 'dashboard',
      platform: 'react',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.7,
      downloads: 987,
      isPremium: false,
      tags: ['admin', 'dashboard', 'analytics'],
      author: 'React Pro'
    },
    {
      id: '4',
      name: 'Mobile Banking App',
      description: 'Secure mobile banking interface with transaction history and payments.',
      category: 'mobile',
      platform: 'flutter',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.6,
      downloads: 756,
      isPremium: true,
      tags: ['mobile', 'banking', 'finance'],
      author: 'Flutter Dev',
      price: 49
    },
    {
      id: '5',
      name: 'Portfolio Website',
      description: 'Elegant portfolio template for creative professionals and agencies.',
      category: 'landing',
      platform: 'react',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.5,
      downloads: 654,
      isPremium: false,
      tags: ['portfolio', 'creative', 'agency'],
      author: 'Creative Hub'
    },
    {
      id: '6',
      name: 'Restaurant Website',
      description: 'Beautiful restaurant website with menu, reservations, and location.',
      category: 'landing',
      platform: 'vue',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.4,
      downloads: 543,
      isPremium: false,
      tags: ['restaurant', 'food', 'booking'],
      author: 'Vue Kitchen'
    },
    {
      id: '7',
      name: 'Task Management App',
      description: 'Productive task management app with kanban boards and team collaboration.',
      category: 'dashboard',
      platform: 'angular',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.3,
      downloads: 432,
      isPremium: true,
      tags: ['task', 'kanban', 'productivity'],
      author: 'Angular Team',
      price: 39
    },
    {
      id: '8',
      name: 'Fitness Tracking App',
      description: 'Comprehensive fitness app with workout tracking and progress analytics.',
      category: 'mobile',
      platform: 'swiftui',
      thumbnail: '/api/placeholder/400/300',
      rating: 4.2,
      downloads: 321,
      isPremium: false,
      tags: ['fitness', 'health', 'tracking'],
      author: 'iOS Fitness'
    }
  ]

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesPlatform = selectedPlatform === 'all' || template.platform === selectedPlatform
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesPlatform && matchesSearch
  })

  const handleUseTemplate = (template: Template) => {
    if (template.isPremium) {
      toast.success(`Redirecting to purchase ${template.name}...`)
    } else {
      toast.success(`Starting new project with ${template.name}...`)
      window.location.href = `/create?template=${template.id}`
    }
  }

  const handlePreview = (template: Template) => {
    toast.success(`Opening preview for ${template.name}...`)
  }

  const handleFavorite = (template: Template) => {
    toast.success(`${template.name} added to favorites!`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">Template Gallery</h1>
            </div>
            
            <div className="flex items-center space-x-4">
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
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="downloads">Most Downloaded</option>
              </select>
            </div>
          </div>

          {/* Category and Platform Filters */}
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Platforms</h3>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedPlatform === platform.id
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{platform.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredTemplates.length} of {templates.length} templates
          </p>
        </div>

        {/* Templates Grid/List */}
        {viewMode === 'grid' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="aspect-video bg-gray-100 relative group">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handlePreview(template)}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFavorite(template)}
                        className="p-2 bg-white rounded-lg text-gray-700 hover:text-red-600 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Premium Badge */}
                  {template.isPremium && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center space-x-1">
                        <Crown className="w-3 h-3" />
                        <span>Premium</span>
                      </span>
                    </div>
                  )}

                  {/* Platform Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs bg-gray-800 text-white rounded-full">
                      {template.platform}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{template.rating}</span>
                    </div>
                    <span className="text-sm text-gray-600">{template.downloads} downloads</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">by {template.author}</span>
                    {template.isPremium && template.price && (
                      <span className="text-sm font-medium text-gray-900">${template.price}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full mt-3 btn-primary flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{template.isPremium ? 'Get Template' : 'Use Template'}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>by {template.author}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{template.rating}</span>
                          </div>
                          <span>{template.downloads} downloads</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {template.isPremium && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center space-x-1">
                            <Crown className="w-3 h-3" />
                            <span>Premium</span>
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {template.platform}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePreview(template)}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleFavorite(template)}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <Heart className="w-4 h-4" />
                          <span>Favorite</span>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>{template.isPremium ? 'Get Template' : 'Use Template'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedPlatform('all')
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
} 