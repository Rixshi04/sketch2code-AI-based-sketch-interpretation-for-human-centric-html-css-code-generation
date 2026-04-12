'use client'

import { Monitor, Smartphone, Globe, Zap, Palette, Library } from 'lucide-react'
import { useState } from 'react'

export interface PlatformSelectorProps {
  selectedPlatform: string
  onPlatformChange: (platform: string) => void
  selectedLibrary?: string
  onLibraryChange?: (library: string) => void
  onNext?: () => void
}

const platforms = [
  {
    id: 'react',
    name: 'React',
    description: 'Web applications with React',
    icon: Monitor,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    features: ['JSX/TSX', 'Component-based', 'Hooks', 'Virtual DOM'],
    libraries: [
      { id: 'none', name: 'Plain React', description: 'No UI library' },
      { id: 'mui', name: 'Material-UI', description: 'Google Material Design' },
      { id: 'antd', name: 'Ant Design', description: 'Enterprise UI library' },
      { id: 'chakra', name: 'Chakra UI', description: 'Accessible components' },
      { id: 'tailwind', name: 'Tailwind CSS', description: 'Utility-first CSS' },
      { id: 'bootstrap', name: 'React Bootstrap', description: 'Bootstrap components' }
    ]
  },
  {
    id: 'vue',
    name: 'Vue.js',
    description: 'Progressive web framework',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    features: ['Single File Components', 'Reactive', 'Composition API', 'Vue Router'],
    libraries: [
      { id: 'none', name: 'Plain Vue', description: 'No UI library' },
      { id: 'vuetify', name: 'Vuetify', description: 'Material Design for Vue' },
      { id: 'element', name: 'Element Plus', description: 'Vue 3 UI library' },
      { id: 'quasar', name: 'Quasar', description: 'Cross-platform Vue framework' },
      { id: 'tailwind', name: 'Tailwind CSS', description: 'Utility-first CSS' }
    ]
  },
  {
    id: 'angular',
    name: 'Angular',
    description: 'Enterprise web applications',
    icon: Zap,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    features: ['TypeScript', 'Dependency Injection', 'RxJS', 'Angular CLI'],
    libraries: [
      { id: 'none', name: 'Plain Angular', description: 'No UI library' },
      { id: 'material', name: 'Angular Material', description: 'Material Design' },
      { id: 'primeng', name: 'PrimeNG', description: 'Rich UI components' },
      { id: 'ng-zorro', name: 'NG-ZORRO', description: 'Ant Design for Angular' },
      { id: 'tailwind', name: 'Tailwind CSS', description: 'Utility-first CSS' }
    ]
  },
  {
    id: 'flutter',
    name: 'Flutter',
    description: 'Cross-platform mobile apps',
    icon: Smartphone,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: ['Dart', 'Widget-based', 'Hot Reload', 'Material Design'],
    libraries: [
      { id: 'none', name: 'Plain Flutter', description: 'No additional library' },
      { id: 'material', name: 'Material Design', description: 'Google Material Design' },
      { id: 'cupertino', name: 'Cupertino', description: 'iOS-style components' },
      { id: 'fluent', name: 'Fluent Design', description: 'Microsoft Fluent Design' }
    ]
  },
  {
    id: 'swiftui',
    name: 'SwiftUI',
    description: 'iOS native applications',
    icon: Smartphone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    features: ['Swift', 'Declarative', 'iOS 13+', 'Xcode Integration'],
    libraries: [
      { id: 'none', name: 'Plain SwiftUI', description: 'No additional library' },
      { id: 'sf-symbols', name: 'SF Symbols', description: 'Apple icon system' },
      { id: 'swiftui-charts', name: 'SwiftUI Charts', description: 'Data visualization' }
    ]
  }
]

export default function PlatformSelector({ 
  selectedPlatform, 
  onPlatformChange, 
  selectedLibrary,
  onLibraryChange,
  onNext 
}: PlatformSelectorProps) {
  const [showLibraries, setShowLibraries] = useState(false)
  
  const currentPlatform = platforms.find(p => p.id === selectedPlatform)
  const libraries = currentPlatform?.libraries || []

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Target Platform</h3>
        <p className="text-gray-600">
          Choose the platform and UI library for your generated code
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon
          const isSelected = selectedPlatform === platform.id
          
          return (
            <div
              key={platform.id}
              onClick={() => {
                onPlatformChange(platform.id)
                setShowLibraries(true)
              }}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? `${platform.borderColor} ${platform.bgColor} ring-2 ring-primary-500`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${platform.bgColor}`}>
                  <Icon className={`w-6 h-6 ${platform.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {platform.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {platform.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {platform.features.slice(0, 2).map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Component Library Selection */}
      {showLibraries && currentPlatform && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Library className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">
              Select UI Library for {currentPlatform.name}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {libraries.map((library) => (
              <div
                key={library.id}
                onClick={() => onLibraryChange?.(library.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedLibrary === library.id
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <h5 className="font-medium text-gray-900 mb-1">
                  {library.name}
                </h5>
                <p className="text-sm text-gray-600">
                  {library.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={() => setShowLibraries(false)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext || (() => {})}
          disabled={!selectedPlatform}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
} 