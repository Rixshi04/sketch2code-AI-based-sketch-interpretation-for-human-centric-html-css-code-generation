const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up SketchMaster database...')

  // Create sample templates
  const templates = [
    {
      name: 'Modern Landing Page',
      description: 'A beautiful, responsive landing page with modern design patterns and animations.',
      category: 'landing',
      platform: 'react',
      codeContent: `import React from 'react';
import { motion } from 'framer-motion';

export default function ModernLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-gray-900"
          >
            Brand
          </motion.div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
          </div>
        </nav>
      </header>
      
      <main className="container mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Ideas Into
            <span className="text-blue-600"> Reality</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build beautiful, responsive websites and applications with our AI-powered design tools.
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
            Get Started
          </button>
        </motion.div>
      </main>
    </div>
  );
}`,
      codeLanguage: 'tsx',
      thumbnail: '/api/placeholder/400/300',
      isPremium: false,
      tags: ['responsive', 'modern', 'landing'],
      features: ['Responsive Design', 'Framer Motion', 'Tailwind CSS'],
      isPublished: true,
    },
    {
      name: 'E-commerce Store',
      description: 'Complete e-commerce solution with product catalog, cart, and checkout.',
      category: 'ecommerce',
      platform: 'vue',
      codeContent: `<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="container mx-auto px-6 py-4">
        <nav class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">ShopVue</h1>
          <div class="flex items-center space-x-4">
            <button class="text-gray-600 hover:text-gray-900">
              <span class="sr-only">Cart</span>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>

    <main class="container mx-auto px-6 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="product in products" :key="product.id" class="bg-white rounded-lg shadow-sm overflow-hidden">
          <img :src="product.image" :alt="product.name" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-900">{{ product.name }}</h3>
            <p class="text-gray-600 mt-1">{{ product.description }}</p>
            <div class="flex items-center justify-between mt-4">
              <span class="text-2xl font-bold text-gray-900">${{ product.price }}</span>
              <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const products = ref([
  {
    id: 1,
    name: 'Wireless Headphones',
    description: 'Premium wireless headphones with noise cancellation',
    price: 199.99,
    image: '/api/placeholder/300/200'
  },
  {
    id: 2,
    name: 'Smart Watch',
    description: 'Feature-rich smartwatch with health tracking',
    price: 299.99,
    image: '/api/placeholder/300/200'
  },
  {
    id: 3,
    name: 'Laptop Stand',
    description: 'Ergonomic laptop stand for better posture',
    price: 49.99,
    image: '/api/placeholder/300/200'
  },
  {
    id: 4,
    name: 'Wireless Mouse',
    description: 'Precision wireless mouse for productivity',
    price: 79.99,
    image: '/api/placeholder/300/200'
  }
])
</script>`,
      codeLanguage: 'vue',
      thumbnail: '/api/placeholder/400/300',
      isPremium: true,
      price: 29.99,
      tags: ['ecommerce', 'shopping', 'cart'],
      features: ['Product Catalog', 'Shopping Cart', 'Responsive Design'],
      isPublished: true,
    },
    {
      name: 'Admin Dashboard',
      description: 'Professional admin dashboard with charts, tables, and user management.',
      category: 'dashboard',
      platform: 'react',
      codeContent: `import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Jan', users: 400, revenue: 2400 },
  { name: 'Feb', users: 300, revenue: 1398 },
  { name: 'Mar', users: 200, revenue: 9800 },
  { name: 'Apr', users: 278, revenue: 3908 },
  { name: 'May', users: 189, revenue: 4800 },
  { name: 'Jun', users: 239, revenue: 3800 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={\`w-full text-left px-6 py-3 \${activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}\`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={\`w-full text-left px-6 py-3 \${activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}\`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={\`w-full text-left px-6 py-3 \${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}\`}
            >
              Analytics
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">12,345</p>
              <p className="text-sm text-gray-600">+12% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
              <p className="text-3xl font-bold text-green-600">$45,678</p>
              <p className="text-sm text-gray-600">+8% from last month</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
              <p className="text-3xl font-bold text-purple-600">89</p>
              <p className="text-sm text-gray-600">+5% from last month</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#3B82F6" />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  );
}`,
      codeLanguage: 'tsx',
      thumbnail: '/api/placeholder/400/300',
      isPremium: false,
      tags: ['admin', 'dashboard', 'analytics'],
      features: ['Charts', 'User Management', 'Analytics'],
      isPublished: true,
    },
  ]

  // Create a sample user for templates
  const sampleUser = await prisma.user.upsert({
    where: { email: 'admin@sketchmaster.com' },
    update: {},
    create: {
      email: 'admin@sketchmaster.com',
      name: 'SketchMaster Admin',
      isPremium: true,
      planType: 'pro',
    },
  })

  console.log('✅ Created sample user:', sampleUser.email)

  // Create templates
  for (const template of templates) {
    const createdTemplate = await prisma.template.create({
      data: {
        ...template,
        userId: sampleUser.id,
      },
    })
    console.log('✅ Created template:', createdTemplate.name)
  }

  console.log('🎉 Database setup completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error setting up database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 