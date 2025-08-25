import React from 'react'
import { Search, Settings, User, Bell, ChevronDown, Eye, BarChart3, Users, Plus, Camera, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { ChatDock } from '@/components/chat/ChatDock'

export default function HomePage() {
  const roofData = [
    {
      id: "E1",
      name: "Demo Roof",
      description: "Main demonstration roof with sample defects and pins",
      status: "Critical",
      statusColor: "danger",
      completion: "72%",
      pins: 35,
      defects: 8,
      site: "SPT2024-001•Demo Site_Construction City"
    },
    {
      id: "R2",
      name: "Office Complex A",
      description: "Commercial building roof inspection",
      status: "Review",
      statusColor: "warning", 
      completion: "85%",
      pins: 42,
      defects: 3,
      site: "SPT2024-002•Downtown Complex"
    },
    {
      id: "R3",
      name: "Residential Block B",
      description: "Multi-family housing roof assessment",
      status: "Active",
      statusColor: "success",
      completion: "94%",
      pins: 28,
      defects: 1,
      site: "SPT2024-003•Suburban Development"
    }
  ]

  const getStatusStyles = (statusColor: string) => {
    switch (statusColor) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
      case 'warning':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
      case 'success':
        return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25'
      default:
        return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Premium 3D Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-white/20 shadow-xl shadow-indigo-500/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-6 h-6 bg-white rounded-md opacity-90"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  SmartPin TPO
                </h1>
                <p className="text-sm text-slate-500 font-medium">Quality Management Platform</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search roofs..."
                  className="pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-lg shadow-slate-500/5 transition-all duration-300"
                />
              </div>
              
              {/* Action Buttons */}
              <button className="p-2 bg-white/50 hover:bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg shadow-slate-500/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Bell className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 bg-white/50 hover:bg-white/70 backdrop-blur-sm border border-white/30 rounded-lg shadow-lg shadow-slate-500/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4">
          <button className="btn-filter inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 text-slate-700 font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200">
            Open Issues
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">12</span>
          </button>
          <button className="btn-filter inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 text-slate-700 font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200">
            Ready
            <span className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold">8</span>
          </button>
          <button className="btn-filter inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 text-slate-700 font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200">
            Closed
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">145</span>
          </button>
          <button className="btn-filter inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/30 text-slate-700 font-medium hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200">
            All Issues
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">165</span>
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Roofs */}
          <div className="kpi card-3d">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-500">Total Roofs</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">5</div>
            <p className="text-sm text-emerald-600 font-medium">↗ Active projects</p>
          </div>

          {/* Total Pins */}
          <div className="kpi card-3d">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-500">Total Pins</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">197</div>
            <p className="text-sm text-blue-600 font-medium">Inspection points</p>
          </div>

          {/* Open Defects */}
          <div className="kpi card-3d">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-500">Open Defects</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">62</div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">11 Critical</span>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            </div>
          </div>

          {/* Avg Completion */}
          <div className="kpi card-3d">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-500">Avg Completion</span>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">72%</div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>
        </div>

        {/* Roofs List */}
        <div className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl shadow-xl shadow-slate-500/10">
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Active Roofs</h2>
              <span className="text-sm text-slate-500 font-medium">5 of 5 roofs</span>
            </div>
          </div>
          
          <div className="divide-y divide-white/20">
            {roofData.map((roof) => (
              <div key={roof.id} className="p-6 hover:bg-white/30 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {roof.name}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyles(roof.statusColor)}`}>
                        {roof.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">{roof.description}</p>
                    <p className="text-xs text-slate-500 font-mono">{roof.site}</p>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium text-slate-700">
                      Completion: <span className="text-emerald-600">{roof.completion}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {roof.pins} pins • {roof.defects} defects
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {roof.pins} pins
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {roof.defects} issues
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated today
                    </span>
                  </div>
                  
                  <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 opacity-0 group-hover:opacity-100">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Image Section */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-slate-500/20">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent z-10"></div>
          <img 
            src="/api/placeholder/800/400" 
            alt="Construction buildings" 
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-6 left-6 z-20 text-white">
            <h3 className="text-xl font-bold mb-2">Professional Construction Quality Management</h3>
            <p className="text-white/80 text-sm">Advanced 3D inspection tools for modern construction projects</p>
          </div>
        </div>

      </div>
      
      {/* Chat Dock */}
      <ChatDock />
    </div>
  )
}