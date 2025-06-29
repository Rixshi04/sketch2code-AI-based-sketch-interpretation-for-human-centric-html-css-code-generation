'use client'

import { Monitor, Smartphone, Globe, Zap } from 'lucide-react'

interface PlatformSelectorProps {
  selectedPlatform: string
  onPlatformChange: (platform: string) => void
  onNext: () => void
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
    features: ['JSX/TSX', 'Component-based', 'Hooks', 'Virtual DOM']
  },
  {
    id: 'vue',
    name: 'Vue.js',
    description: 'Progressive web framework',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    features: ['Single File Components', 'Reactive', 'Composition API', 'Vue Router']
  },
  {
    id: 'angular',
    name: 'Angular',
    description: 'Enterprise web applications',
    icon: Zap,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    features: ['TypeScript', 'Dependency Injection', 'RxJS', 'Angular CLI']
  },
  {
    id: 'flutter',
    name: 'Flutter',
    description: 'Cross-platform mobile apps',
    icon: Smartphone,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: ['Dart', 'Widget-based', 'Hot Reload', 'Material Design']
  },
  {
    id: 'swiftui',
    name: 'SwiftUI',
    description: 'iOS native applications',
    icon: Smartphone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    features: ['Swift', 'Declarative', 'iOS 13+', 'Xcode Integration']
  }
]

export default function PlatformSelector({ 
  selectedPlatform, 
  onPlatformChange, 
  onNext 
}: PlatformSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Target Platform</h3>
        <p className="text-gray-600">
          Choose the platform for your generated code
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon
          const isSelected = selectedPlatform === platform.id
          
          return (
            <div
              key={platform.id}
              onClick={() => onPlatformChange(platform.id)}
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
                  <p className="text-sm text-gray-600 mb-3">
                    {platform.description}
                  </p>
                  <div className="space-y-1">
                    {platform.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          Selected Platform: {platforms.find(p => p.id === selectedPlatform)?.name}
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          {platforms.find(p => p.id === selectedPlatform)?.description}
        </p>
        <button
          onClick={onNext}
          className="btn-primary w-full"
        >
          Continue to Code Generation
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Platform Recommendations:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>React:</strong> Best for web apps and component libraries</li>
          <li>• <strong>Vue:</strong> Great for progressive web applications</li>
          <li>• <strong>Angular:</strong> Ideal for large enterprise applications</li>
          <li>• <strong>Flutter:</strong> Perfect for cross-platform mobile apps</li>
          <li>• <strong>SwiftUI:</strong> Best for iOS-only applications</li>
        </ul>
      </div>
    </div>
  )
} 