"use client"

import React, { ReactNode } from 'react'
import { Search, Settings, User, Bell, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ConnectionStatus } from '@/components/realtime/ConnectionStatus'
import { ChatDock } from '@/components/chat/ChatDock'
import { useAuth } from '@/lib/hooks/useAuth'

interface PageLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
  actions?: ReactNode
  breadcrumbs?: Array<{ label: string; href?: string }>
  className?: string
  contentClassName?: string
  showSearch?: boolean
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void
}

export function PageLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backHref = '/',
  actions,
  breadcrumbs,
  className = '',
  contentClassName = '',
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearchChange,
}: PageLayoutProps) {
  const { profile } = useAuth()
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 ${className}`}>
      {/* Premium 3D Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-b border-white/20 dark:border-slate-700/50 shadow-xl shadow-indigo-500/5 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-500 dark:to-blue-600 rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-md opacity-90"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  SmartPin TPO
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium hidden sm:block">Quality Management Platform</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              {showSearch && (
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-lg shadow-slate-500/5 transition-all duration-300 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
              
              {/* Connection Status */}
              <ConnectionStatus variant="inline" />
              
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Action Buttons */}
              <button className="p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-lg shadow-lg shadow-slate-500/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <Link href="/settings">
                <button className="p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-lg shadow-lg shadow-slate-500/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </Link>
              <div className="relative group">
                <button className="p-2 bg-gradient-to-r from-indigo-600 to-blue-700 dark:from-indigo-500 dark:to-blue-600 text-white rounded-lg shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  <User className="w-5 h-5" />
                </button>
                {profile && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-white/30 dark:border-slate-700/50 rounded-lg shadow-xl p-3 min-w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{profile.full_name}</div>
                      <div className="text-slate-600 dark:text-slate-400">{profile.email}</div>
                      <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                        {profile.role || 'User'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-b border-white/40 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span>/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              {showBackButton && (
                <Link href={backHref}>
                  <button className="p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded-lg shadow-lg shadow-slate-500/10 transition-all duration-300 hover:scale-105">
                    <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </button>
                </Link>
              )}
              
              {/* Page Title */}
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
                {subtitle && (
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Page Actions */}
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-6 sm:px-8 py-8 pb-safe ${contentClassName}`}>
        {children}
      </main>

      {/* Chat Dock */}
      <ChatDock />
    </div>
  )
}
