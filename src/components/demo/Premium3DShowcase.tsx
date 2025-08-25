'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Settings, 
  Search, 
  Bell, 
  User, 
  Home, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'

export function Premium3DShowcase() {
  const [progress, setProgress] = useState(65)
  const [isLoading, setIsLoading] = useState(false)

  const handleButtonClick = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-concrete-50 via-steel-50 to-construction-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Premium Navigation */}
        <nav className="bg-white/95 backdrop-blur-md border-b border-steel-200/50 shadow-lg px-6 py-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-gray-700 bg-clip-text text-transparent">
                SmartPin TPO
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="bg-gray-100 hover:bg-gray-200 shadow-md transition-all duration-200" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button className="bg-gray-100 hover:bg-gray-200 shadow-md transition-all duration-200" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button className="bg-gray-100 hover:bg-gray-200 shadow-md transition-all duration-200" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-steel-900">
            Premium 3D Visual Theme
          </h1>
          <p className="text-steel-600 text-lg max-w-2xl mx-auto">
            Sophisticated construction industry design system featuring glass morphism, 
            neumorphism, and premium 3D effects for professional applications.
          </p>
        </div>

        {/* Button Showcase */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Premium Button Styles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 3D Primary Buttons */}
            <div className="space-y-4">
              <h3 className="font-semibold text-steel-700">3D Primary Buttons</h3>
              <div className="space-y-3">
                <Button 
                  className="btn-3d-primary w-full"
                  onClick={handleButtonClick}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </>
                  )}
                </Button>
                <Button className="btn-3d-primary w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Quality Check
                </Button>
              </div>
            </div>

            {/* 3D Secondary Buttons */}
            <div className="space-y-4">
              <h3 className="font-semibold text-steel-700">3D Secondary Buttons</h3>
              <div className="space-y-3">
                <Button className="btn-3d-secondary w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Search Items
                </Button>
                <Button className="btn-3d-secondary w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Neumorphic Buttons */}
            <div className="space-y-4">
              <h3 className="font-semibold text-steel-700">Neumorphic Style</h3>
              <div className="space-y-3">
                <Button className="btn-neu w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button className="btn-neu w-full">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Card Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Glass Morphism Card */}
          <div className="card-glass">
            <h3 className="text-lg font-semibold text-steel-900 mb-3">Glass Morphism</h3>
            <p className="text-steel-700 text-sm mb-4">
              Translucent glass effect with backdrop blur for modern, elegant interfaces.
            </p>
            <div className="flex justify-between items-center">
              <Badge className="status-indicator-3d ready">Active</Badge>
              <div className="spinner-3d"></div>
            </div>
          </div>

          {/* Premium Elevated Card */}
          <div className="card-premium">
            <h3 className="text-lg font-semibold text-steel-900 mb-3">Premium Elevation</h3>
            <p className="text-steel-700 text-sm mb-4">
              Sophisticated depth and layering for professional construction applications.
            </p>
            <div className="space-y-3">
              <div className="progress-3d">
                <div 
                  className="progress-3d-fill transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-steel-600">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>

          {/* Status Indicators Card */}
          <div className="card-premium">
            <h3 className="text-lg font-semibold text-steel-900 mb-3">Status System</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-steel-700">Critical Issues</span>
                <Badge className="status-indicator-3d open">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Open
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-steel-700">Ready for Review</span>
                <Badge className="status-indicator-3d ready">
                  <Clock className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-steel-700">Completed Items</span>
                <Badge className="status-indicator-3d closed">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Closed
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Elements Showcase */}
        <div className="card-premium">
          <h2 className="text-2xl font-bold text-steel-900 mb-6">Interactive 3D Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Form Elements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-steel-700">Form Controls</h3>
              <div className="space-y-4">
                <Input 
                  className="input-3d" 
                  placeholder="Search construction items..."
                />
                <Input 
                  className="input-3d" 
                  type="email"
                  placeholder="engineer@company.com"
                />
                <div className="flex gap-2">
                  <Input className="input-3d flex-1" placeholder="Quantity" />
                  <Input className="input-3d flex-1" placeholder="Unit" />
                </div>
              </div>
            </div>

            {/* Interactive Grid */}
            <div className="space-y-4">
              <h3 className="font-semibold text-steel-700">Interactive Elements</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="element-interactive bg-gradient-to-br from-construction-100 to-construction-200 p-4 rounded-xl text-center">
                  <BarChart3 className="w-6 h-6 mx-auto mb-2 text-construction-600" />
                  <p className="text-sm font-medium text-construction-800">Analytics</p>
                </div>
                <div className="element-interactive bg-gradient-to-br from-safety-100 to-safety-200 p-4 rounded-xl text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-safety-600" />
                  <p className="text-sm font-medium text-safety-800">Quality</p>
                </div>
                <div className="element-interactive bg-gradient-to-br from-steel-100 to-steel-200 p-4 rounded-xl text-center">
                  <Settings className="w-6 h-6 mx-auto mb-2 text-steel-600" />
                  <p className="text-sm font-medium text-steel-800">Settings</p>
                </div>
                <div className="element-interactive bg-gradient-to-br from-success-100 to-success-200 p-4 rounded-xl text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-success-600" />
                  <p className="text-sm font-medium text-success-800">Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette Showcase */}
        <div className="card-premium">
          <h2 className="text-2xl font-bold text-steel-900 mb-6">Construction Industry Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Construction Blue */}
            <div className="space-y-3">
              <h4 className="font-semibold text-steel-700">Construction Blue</h4>
              <div className="space-y-2">
                <div className="h-12 bg-construction-300 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-construction-800 text-xs font-medium">300</span>
                </div>
                <div className="h-12 bg-construction-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">500</span>
                </div>
                <div className="h-12 bg-construction-700 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">700</span>
                </div>
              </div>
            </div>

            {/* Steel Gray */}
            <div className="space-y-3">
              <h4 className="font-semibold text-steel-700">Steel Gray</h4>
              <div className="space-y-2">
                <div className="h-12 bg-steel-300 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-steel-800 text-xs font-medium">300</span>
                </div>
                <div className="h-12 bg-steel-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">500</span>
                </div>
                <div className="h-12 bg-steel-700 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">700</span>
                </div>
              </div>
            </div>

            {/* Safety Orange */}
            <div className="space-y-3">
              <h4 className="font-semibold text-steel-700">Safety Orange</h4>
              <div className="space-y-2">
                <div className="h-12 bg-safety-300 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-safety-800 text-xs font-medium">300</span>
                </div>
                <div className="h-12 bg-safety-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">500</span>
                </div>
                <div className="h-12 bg-safety-700 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">700</span>
                </div>
              </div>
            </div>

            {/* Status Colors */}
            <div className="space-y-3">
              <h4 className="font-semibold text-steel-700">Status Colors</h4>
              <div className="space-y-2">
                <div className="h-12 bg-success-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Success</span>
                </div>
                <div className="h-12 bg-warning-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Warning</span>
                </div>
                <div className="h-12 bg-danger-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Danger</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Typography & Spacing */}
        <div className="card-premium">
          <h2 className="text-2xl font-bold text-steel-900 mb-6">Typography & Hierarchy</h2>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-steel-900">Heading 1 - Project Title</h1>
            <h2 className="text-3xl font-semibold text-steel-800">Heading 2 - Section Title</h2>
            <h3 className="text-2xl font-semibold text-steel-700">Heading 3 - Subsection</h3>
            <h4 className="text-xl font-medium text-steel-700">Heading 4 - Component Title</h4>
            <p className="text-steel-600 leading-relaxed">
              Body text for construction documentation and detailed descriptions. 
              This font size and line height are optimized for readability in 
              professional construction management applications.
            </p>
            <p className="text-sm text-steel-500">
              Small text for metadata, timestamps, and secondary information 
              in the construction quality management system.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}