'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function LuxuryHeader() {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-luxury-200/30 shadow-luxury-lg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-luxury">
              <span className="text-white font-bold text-lg">SP</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-luxury-900">SmartPin Construction</h1>
              <p className="text-sm text-luxury-600 font-medium">TPO Quality Management Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="hidden bg-white/80 backdrop-blur-sm hover:bg-white/90 p-2 rounded-xl transition-all duration-200 flex items-center space-x-2 shadow-luxury" id="backButton">
                <svg className="w-5 h-5 text-luxury-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                <span className="text-luxury-600 font-medium">Back</span>
              </button>
              <nav className="flex items-center space-x-2 text-sm text-luxury-600" id="breadcrumb">
                <Link href="/roofs" className="hover:text-luxury-900 font-medium">Dashboard</Link>
                <span className="hidden" id="breadcrumbSeparator">•</span>
                <span className="text-luxury-900 font-semibold hidden" id="currentRoof"></span>
              </nav>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <select className="bg-white/80 backdrop-blur-sm border border-luxury-200 rounded-xl px-4 py-2 text-sm font-medium text-luxury-700 shadow-luxury focus:ring-2 focus:ring-gold-400 focus:border-transparent">
              <option>🇺🇸 English</option>
              <option>🇮🇱 עברית</option>
              <option>🇸🇦 العربية</option>
            </select>
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-luxury">
              <div className="w-10 h-10 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">JS</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-luxury-900">John Supervisor</div>
                <div className="text-xs text-luxury-600">Quality Manager</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// Default export for index.ts
export default LuxuryHeader