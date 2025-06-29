'use client'

import { useState } from 'react'
import { Monitor, Smartphone, Tablet, Maximize2, Minimize2, RotateCcw, X } from 'lucide-react'

interface PreviewPanelProps {
  code: string
  platform: string
}

const deviceSizes = [
  { name: 'Desktop', icon: Monitor, width: 'w-full', height: 'h-96' },
  { name: 'Tablet', icon: Tablet, width: 'w-96', height: 'h-96' },
  { name: 'Mobile', icon: Smartphone, width: 'w-80', height: 'h-96' },
]

export default function PreviewPanel({ code, platform }: PreviewPanelProps) {
  const [selectedDevice, setSelectedDevice] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const createPreviewHTML = () => {
    // Extract the component JSX and create a full HTML document
    const componentCode = code.replace(/import.*?;/g, '').replace(/export.*?;/g, '')
    
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SketchMaster Preview</title>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
            .preview-container { width: 100%; height: 100%; overflow: auto; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            ${componentCode}
            ReactDOM.render(React.createElement(GeneratedComponent), document.getElementById('root'));
          </script>
        </body>
      </html>
    `
  }

  const currentDevice = deviceSizes[selectedDevice]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Live Preview</h3>
        <div className="flex items-center space-x-2">
          {/* Device Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {deviceSizes.map((device, index) => {
              const Icon = device.icon
              return (
                <button
                  key={device.name}
                  onClick={() => setSelectedDevice(index)}
                  className={`p-2 rounded-md transition-colors ${
                    selectedDevice === index
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={device.name}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshPreview}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh Preview"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Platform Info */}
        <div className="text-sm text-gray-600 mb-4">
          Platform: <span className="font-medium capitalize">{platform}</span>
        </div>

        {/* Preview Container */}
        <div className={`mx-auto border border-gray-200 rounded-lg overflow-hidden bg-white ${
          isFullscreen ? 'fixed inset-4 z-50' : currentDevice.width
        }`}>
          <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-xs text-gray-600">
              {currentDevice.name} Preview
            </div>
            {isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className={`${currentDevice.height} overflow-auto`}>
            {code ? (
              <iframe
                key={previewKey}
                srcDoc={createPreviewHTML()}
                className="w-full h-full border-0"
                title="Code Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Generate code to see preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Controls */}
        {!isFullscreen && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Device: {currentDevice.name}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Responsive Preview</span>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="responsive"
                  defaultChecked
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="responsive">Enabled</label>
              </div>
            </div>
          </div>
        )}

        {/* Preview Tips */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Preview Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use different device sizes to test responsiveness</li>
            <li>• Check how your UI looks on various screen sizes</li>
            <li>• Test interactions and hover states</li>
            <li>• Verify accessibility features work correctly</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 