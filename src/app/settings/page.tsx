'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Palette, 
  Monitor, 
  Save,
  ArrowLeft,
  MapPin,
  Camera,
  Download,
  Upload,
  Users,
  Tag,
  Smartphone,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'SmartPin TPO',
    companyLogo: '',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    language: 'en-US',
    
    // User Profile
    userName: 'Asaf Peer',
    userEmail: 'asaf6peer@gmail.com',
    userRole: 'admin',
    userAvatar: '',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    notifyOnNewIssues: true,
    notifyOnStatusChange: true,
    dailyReports: false,
    
    // Project Settings
    defaultProjectTemplate: 'standard',
    autoGenerateIncrId: true,
    requirePhotoForClosure: true,
    defaultInspector: 'Asaf Peer',
    defaultContractor: 'Rafed Ltd.',
    defaultForeman: 'John Doe',
    
    // Quality Control Settings
    minPhotoResolution: '1920x1080',
    maxFileSize: '10MB',
    allowedFileTypes: 'JPG, PNG, WebP',
    autoBackup: true,
    backupFrequency: 'daily',
    
    // Display Settings
    theme: 'light',
    showCoordinates: true,
    showWeekNumbers: true,
    compactView: false,
    highContrast: false,
    
    // Advanced Settings
    debugMode: false,
    apiEndpoint: 'https://api.smartpin-tpo.com',
    cacheSize: '500MB',
    offlineMode: false
  })

  // Project Status Categories
  const [statusCategories, setStatusCategories] = useState([
    { id: '1', name: 'Open', color: '#ef4444', description: 'New or active defects' },
    { id: '2', name: 'In Progress', color: '#f97316', description: 'Work in progress' },
    { id: '3', name: 'Ready for Inspection', color: '#eab308', description: 'Awaiting quality check' },
    { id: '4', name: 'Closed', color: '#22c55e', description: 'Completed and verified' },
    { id: '5', name: 'On Hold', color: '#6b7280', description: 'Temporarily paused' }
  ])

  // Defect Master List
  const [defectTypes, setDefectTypes] = useState([
    { id: '1', name: 'Poor Adhesion', category: 'Installation', severity: 'Medium', description: 'Membrane not properly adhered' },
    { id: '2', name: 'Membrane Separation', category: 'Installation', severity: 'High', description: 'Visible gaps in membrane' },
    { id: '3', name: 'Water Penetration', category: 'Structural', severity: 'Critical', description: 'Water infiltration detected' },
    { id: '4', name: 'Seam Failure', category: 'Installation', severity: 'High', description: 'Failed welded seams' },
    { id: '5', name: 'Surface Damage', category: 'Physical', severity: 'Medium', description: 'Punctures or tears' },
    { id: '6', name: 'Flashing Issues', category: 'Installation', severity: 'High', description: 'Improper flashing installation' }
  ])

  // User Management
  const [users, setUsers] = useState([
    { id: '1', name: 'Asaf Peer', email: 'asaf6peer@gmail.com', role: 'Admin', status: 'Active', lastLogin: '2024-08-25' },
    { id: '2', name: 'John Doe', email: 'john@contractor.com', role: 'Inspector', status: 'Active', lastLogin: '2024-08-24' },
    { id: '3', name: 'Sarah Miller', email: 'sarah@qa.com', role: 'Supervisor', status: 'Active', lastLogin: '2024-08-24' },
    { id: '4', name: 'Mike Smith', email: 'mike@contractor.com', role: 'Foreman', status: 'Inactive', lastLogin: '2024-08-20' }
  ])

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    console.log('Saving settings:', settings)
    // TODO: Implement settings save functionality
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = 'smartpin-settings.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                <p className="text-sm text-slate-600">Configure your SmartPin TPO preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleExportSettings} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="#general" className="block p-2 text-sm hover:bg-slate-100 rounded">General</a>
                <a href="#profile" className="block p-2 text-sm hover:bg-slate-100 rounded">Profile</a>
                <a href="#notifications" className="block p-2 text-sm hover:bg-slate-100 rounded">Notifications</a>
                <a href="#projects" className="block p-2 text-sm hover:bg-slate-100 rounded">Project Settings</a>
                <a href="#defects" className="block p-2 text-sm hover:bg-slate-100 rounded">Defect Types</a>
                <a href="#users" className="block p-2 text-sm hover:bg-slate-100 rounded">User Management</a>
                <a href="#quality" className="block p-2 text-sm hover:bg-slate-100 rounded">Quality Control</a>
                <a href="#system" className="block p-2 text-sm hover:bg-slate-100 rounded">System Settings</a>
                <a href="#display" className="block p-2 text-sm hover:bg-slate-100 rounded">Display</a>
                <a href="#advanced" className="block p-2 text-sm hover:bg-slate-100 rounded">Advanced</a>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* General Settings */}
            <Card id="general">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic application configuration and company information
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleSettingChange('companyName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* User Profile */}
            <Card id="profile">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Profile
                </CardTitle>
                <CardDescription>
                  Your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="userName">Full Name</Label>
                  <Input
                    id="userName"
                    value={settings.userName}
                    onChange={(e) => handleSettingChange('userName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="userEmail">Email Address</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={settings.userEmail}
                    onChange={(e) => handleSettingChange('userEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="userRole">Role</Label>
                  <Select value={settings.userRole} onValueChange={(value) => handleSettingChange('userRole', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="inspector">Quality Inspector</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card id="notifications">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage how you receive alerts and updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser push notifications</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">New Issues Alert</p>
                    <p className="text-sm text-muted-foreground">Notify when new issues are created</p>
                  </div>
                  <Switch 
                    checked={settings.notifyOnNewIssues}
                    onCheckedChange={(checked) => handleSettingChange('notifyOnNewIssues', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status Changes</p>
                    <p className="text-sm text-muted-foreground">Notify when issue status changes</p>
                  </div>
                  <Switch 
                    checked={settings.notifyOnStatusChange}
                    onCheckedChange={(checked) => handleSettingChange('notifyOnStatusChange', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Reports</p>
                    <p className="text-sm text-muted-foreground">Receive daily summary reports</p>
                  </div>
                  <Switch 
                    checked={settings.dailyReports}
                    onCheckedChange={(checked) => handleSettingChange('dailyReports', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Settings */}
            <Card id="projects">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Project Settings
                    </CardTitle>
                    <CardDescription>
                      Status categories, defaults, and project configuration
                    </CardDescription>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Status
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Categories */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-4">Status Categories</h4>
                  <div className="space-y-3">
                    {statusCategories.map((status) => (
                      <div key={status.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: status.color }}
                          ></div>
                          <div>
                            <h5 className="font-medium text-slate-800">{status.name}</h5>
                            <p className="text-sm text-slate-600">{status.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Project Defaults */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-4">Project Defaults</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="defaultInspector">Default Inspector</Label>
                      <Input
                        id="defaultInspector"
                        value={settings.defaultInspector}
                        onChange={(e) => handleSettingChange('defaultInspector', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultContractor">Default Contractor</Label>
                      <Input
                        id="defaultContractor"
                        value={settings.defaultContractor}
                        onChange={(e) => handleSettingChange('defaultContractor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultForeman">Default Foreman</Label>
                      <Input
                        id="defaultForeman"
                        value={settings.defaultForeman}
                        onChange={(e) => handleSettingChange('defaultForeman', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-Generate INCR ID</p>
                        <p className="text-sm text-muted-foreground">Automatically create INCR identifiers</p>
                      </div>
                      <Switch 
                        checked={settings.autoGenerateIncrId}
                        onCheckedChange={(checked) => handleSettingChange('autoGenerateIncrId', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Require Closure Photo</p>
                        <p className="text-sm text-muted-foreground">Mandate photos when closing issues</p>
                      </div>
                      <Switch 
                        checked={settings.requirePhotoForClosure}
                        onCheckedChange={(checked) => handleSettingChange('requirePhotoForClosure', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Defect Types Management */}
            <Card id="defects">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Defect Types Management
                    </CardTitle>
                    <CardDescription>
                      Configure and manage the master list of defect types
                    </CardDescription>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Defect Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {defectTypes.map((defect) => (
                    <div key={defect.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-800">{defect.name}</h4>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {defect.category}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            defect.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            defect.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                            defect.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {defect.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{defect.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Management - Admin Only */}
            <Card id="users">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      Manage user permissions and access levels (Admin only)
                    </CardDescription>
                  </div>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{user.name}</h4>
                          <p className="text-sm text-slate-600">{user.email}</p>
                          <p className="text-xs text-slate-500">Last login: {user.lastLogin}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'Inspector' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'Supervisor' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.status}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quality Control Settings */}
            <Card id="quality">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Quality Control
                </CardTitle>
                <CardDescription>
                  Photo requirements and quality standards
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="minPhotoResolution">Minimum Photo Resolution</Label>
                  <Select value={settings.minPhotoResolution} onValueChange={(value) => handleSettingChange('minPhotoResolution', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1280x720">HD (1280x720)</SelectItem>
                      <SelectItem value="1920x1080">Full HD (1920x1080)</SelectItem>
                      <SelectItem value="2560x1440">QHD (2560x1440)</SelectItem>
                      <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxFileSize">Maximum File Size</Label>
                  <Select value={settings.maxFileSize} onValueChange={(value) => handleSettingChange('maxFileSize', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5MB">5MB</SelectItem>
                      <SelectItem value="10MB">10MB</SelectItem>
                      <SelectItem value="25MB">25MB</SelectItem>
                      <SelectItem value="50MB">50MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                  <Input
                    id="allowedFileTypes"
                    value={settings.allowedFileTypes}
                    onChange={(e) => handleSettingChange('allowedFileTypes', e.target.value)}
                    placeholder="JPG, PNG, WebP"
                  />
                </div>
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select value={settings.backupFrequency} onValueChange={(value) => handleSettingChange('backupFrequency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card id="system">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  System Settings
                </CardTitle>
                <CardDescription>
                  Branding, PWA configuration and system-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Branding Section */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-4">Branding & Appearance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="brandingLogo">Company Logo</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg flex items-center justify-center">
                          <div className="w-8 h-8 bg-white rounded opacity-90"></div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg border-2 border-white shadow-sm"></div>
                        <Input
                          id="primaryColor"
                          value="#4f46e5"
                          className="font-mono text-sm"
                          placeholder="#4f46e5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg border-2 border-white shadow-sm"></div>
                        <Input
                          id="secondaryColor"
                          value="#2563eb"
                          className="font-mono text-sm"
                          placeholder="#2563eb"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg border-2 border-white shadow-sm"></div>
                        <Input
                          id="accentColor"
                          value="#10b981"
                          className="font-mono text-sm"
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* PWA Configuration */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-4">PWA (Progressive Web App) Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Enable Offline Mode</p>
                        <p className="text-sm text-muted-foreground">Allow app to work without internet connection</p>
                      </div>
                      <Switch 
                        checked={settings.offlineMode}
                        onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-muted-foreground">Enable browser push notifications for updates</p>
                      </div>
                      <Switch 
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-Install Prompts</p>
                        <p className="text-sm text-muted-foreground">Show &quot;Install App&quot; prompts to users</p>
                      </div>
                      <Switch 
                        checked={true}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Configuration */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-4">System Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="maxUsers">Maximum Users</Label>
                      <Select defaultValue="unlimited">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 Users</SelectItem>
                          <SelectItem value="25">25 Users</SelectItem>
                          <SelectItem value="50">50 Users</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dataRetention">Data Retention Period</Label>
                      <Select defaultValue="2years">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="1year">1 Year</SelectItem>
                          <SelectItem value="2years">2 Years</SelectItem>
                          <SelectItem value="forever">Forever</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card id="display">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Display Preferences
                </CardTitle>
                <CardDescription>
                  Customize the appearance and layout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Coordinates</p>
                    <p className="text-sm text-muted-foreground">Display pin coordinates in INCR cards</p>
                  </div>
                  <Switch 
                    checked={settings.showCoordinates}
                    onCheckedChange={(checked) => handleSettingChange('showCoordinates', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Week Numbers</p>
                    <p className="text-sm text-muted-foreground">Display ISO week numbers in dates</p>
                  </div>
                  <Switch 
                    checked={settings.showWeekNumbers}
                    onCheckedChange={(checked) => handleSettingChange('showWeekNumbers', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compact View</p>
                    <p className="text-sm text-muted-foreground">Use compact layout for tables</p>
                  </div>
                  <Switch 
                    checked={settings.compactView}
                    onCheckedChange={(checked) => handleSettingChange('compactView', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card id="advanced">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Technical configuration and debugging options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="apiEndpoint">API Endpoint</Label>
                    <Input
                      id="apiEndpoint"
                      value={settings.apiEndpoint}
                      onChange={(e) => handleSettingChange('apiEndpoint', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cacheSize">Cache Size</Label>
                    <Select value={settings.cacheSize} onValueChange={(value) => handleSettingChange('cacheSize', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100MB">100MB</SelectItem>
                        <SelectItem value="250MB">250MB</SelectItem>
                        <SelectItem value="500MB">500MB</SelectItem>
                        <SelectItem value="1GB">1GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Debug Mode</p>
                    <p className="text-sm text-muted-foreground">Enable detailed logging and error reporting</p>
                  </div>
                  <Switch 
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Offline Mode</p>
                    <p className="text-sm text-muted-foreground">Enable offline functionality</p>
                  </div>
                  <Switch 
                    checked={settings.offlineMode}
                    onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}