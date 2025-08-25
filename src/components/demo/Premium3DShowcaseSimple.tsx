'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export function Premium3DShowcaseSimple() {
  const [progress, setProgress] = useState(65)
  const [isLoading, setIsLoading] = useState(false)

  const handleButtonClick = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Premium Navigation */}
        <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg px-6 py-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Home className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-slate-700 bg-clip-text text-transparent">
                SmartPin TPO
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-slate-100 hover:bg-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-slate-100 hover:bg-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-slate-100 hover:bg-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
              >
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </nav>

        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-slate-800 bg-clip-text text-transparent">
            Premium 3D Visual Theme
          </h1>
          <p className="text-slate-600 text-lg max-w-3xl mx-auto">
            Sophisticated construction industry design system featuring glass morphism, 
            neumorphism, and premium 3D effects for professional applications.
          </p>
        </div>

        {/* Button Showcase */}
        <Card className="shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Premium Button Styles</CardTitle>
            <CardDescription>
              Modern 3D button designs with sophisticated hover effects and professional styling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Primary Buttons */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">Primary Actions</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
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
                  <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                    <Shield className="w-4 h-4 mr-2" />
                    Quality Check
                  </Button>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">Secondary Actions</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-slate-300"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Items
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-slate-300"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>

              {/* Neumorphic Style */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">Neumorphic Style</h3>
                <div className="space-y-3">
                  <Button 
                    variant="ghost" 
                    className="w-full bg-slate-100 hover:bg-slate-50 text-slate-700 shadow-inner hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    style={{ 
                      boxShadow: '4px 4px 8px rgba(148, 163, 184, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.9)' 
                    }}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full bg-slate-100 hover:bg-slate-50 text-slate-700 shadow-inner hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    style={{ 
                      boxShadow: '4px 4px 8px rgba(148, 163, 184, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.9)' 
                    }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Glass Morphism Card */}
          <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Glass Morphism</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 text-sm mb-4">
                Translucent glass effect with backdrop blur for modern, elegant interfaces.
              </p>
              <div className="flex justify-between items-center">
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 shadow-sm">Active</Badge>
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Elevated Card */}
          <Card className="bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Premium Elevation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 text-sm mb-4">
                Sophisticated depth and layering for professional construction applications.
              </p>
              <div className="space-y-3">
                <Progress value={progress} className="h-3" />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Indicators Card */}
          <Card className="bg-gradient-to-br from-white to-slate-50 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Status System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Critical Issues</span>
                  <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300/50 shadow-sm">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Open
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Ready for Review</span>
                  <Badge className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border border-orange-300/50 shadow-sm">
                    <Clock className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Completed Items</span>
                  <Badge className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50 shadow-sm">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Closed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Elements Showcase */}
        <Card className="shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Interactive 3D Elements</CardTitle>
            <CardDescription>
              Form controls and interactive components with premium styling and smooth animations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Form Elements */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">Form Controls</h3>
                <div className="space-y-4">
                  <Input 
                    className="shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 border-slate-300 focus:border-blue-500" 
                    placeholder="Search construction items..."
                  />
                  <Input 
                    className="shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 border-slate-300 focus:border-blue-500" 
                    type="email"
                    placeholder="engineer@company.com"
                  />
                  <div className="flex gap-2">
                    <Input 
                      className="flex-1 shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 border-slate-300 focus:border-blue-500" 
                      placeholder="Quantity" 
                    />
                    <Input 
                      className="flex-1 shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 border-slate-300 focus:border-blue-500" 
                      placeholder="Unit" 
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Grid */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700">Interactive Elements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl text-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Analytics</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-xl text-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <Shield className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                    <p className="text-sm font-medium text-orange-800">Quality</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-xl text-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <Settings className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium text-slate-800">Settings</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl text-center shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                    <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium text-green-800">Complete</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette Showcase */}
        <Card className="shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Construction Industry Color Palette</CardTitle>
            <CardDescription>
              Professional color system designed for construction quality management applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Construction Blue */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Construction Blue</h4>
                <div className="space-y-2">
                  <div className="h-12 bg-blue-300 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-blue-800 text-xs font-medium">300</span>
                  </div>
                  <div className="h-12 bg-blue-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">500</span>
                  </div>
                  <div className="h-12 bg-blue-700 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">700</span>
                  </div>
                </div>
              </div>

              {/* Steel Gray */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Steel Gray</h4>
                <div className="space-y-2">
                  <div className="h-12 bg-slate-300 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-slate-800 text-xs font-medium">300</span>
                  </div>
                  <div className="h-12 bg-slate-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">500</span>
                  </div>
                  <div className="h-12 bg-slate-700 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">700</span>
                  </div>
                </div>
              </div>

              {/* Safety Orange */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Safety Orange</h4>
                <div className="space-y-2">
                  <div className="h-12 bg-orange-300 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-orange-800 text-xs font-medium">300</span>
                  </div>
                  <div className="h-12 bg-orange-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">500</span>
                  </div>
                  <div className="h-12 bg-orange-700 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">700</span>
                  </div>
                </div>
              </div>

              {/* Status Colors */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700">Status Colors</h4>
                <div className="space-y-2">
                  <div className="h-12 bg-green-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Success</span>
                  </div>
                  <div className="h-12 bg-amber-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Warning</span>
                  </div>
                  <div className="h-12 bg-red-500 rounded-lg border border-white shadow-sm flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Danger</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography & Spacing */}
        <Card className="shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl text-slate-900">Typography & Hierarchy</CardTitle>
            <CardDescription>
              Professional typography system optimized for construction management interfaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-slate-900">Heading 1 - Project Title</h1>
              <h2 className="text-3xl font-semibold text-slate-800">Heading 2 - Section Title</h2>
              <h3 className="text-2xl font-semibold text-slate-700">Heading 3 - Subsection</h3>
              <h4 className="text-xl font-medium text-slate-700">Heading 4 - Component Title</h4>
              <p className="text-slate-600 leading-relaxed">
                Body text for construction documentation and detailed descriptions. 
                This font size and line height are optimized for readability in 
                professional construction management applications with proper contrast and spacing.
              </p>
              <p className="text-sm text-slate-500">
                Small text for metadata, timestamps, and secondary information 
                in the construction quality management system.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-slate-500">
            Premium 3D Theme for SmartPin TPO Construction Platform
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Navigate to <code className="bg-slate-100 px-2 py-1 rounded">/demo/premium-theme</code> to view this showcase
          </p>
        </div>

      </div>
    </div>
  )
}