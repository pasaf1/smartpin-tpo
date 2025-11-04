'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Camera, 
  FileText,
  Users,
  Clock,
  Pin,
  Home,
  Wrench,
  Zap,
  Copy,
  Send
} from 'lucide-react'

interface ChatExampleProps {
  onUseTemplate?: (text: string, mentions?: string[]) => void
  className?: string
}

interface ExampleTemplate {
  id: string
  title: string
  content: string
  description: string
  icon: React.ReactNode
  category: 'inspection' | 'qa' | 'collaboration' | 'reporting'
  mentions?: string[]
  priority?: 'high' | 'medium' | 'low'
}

const EXAMPLE_TEMPLATES: ExampleTemplate[] = [
  // Inspection Templates
  {
    id: 'inspection-issue-found',
    title: 'Issue Found During Inspection',
    content: 'Issue identified: {issue_type} at {location}. Severity: {severity_level}. Requires immediate attention from @qa.team. Photo attached for reference.',
    description: 'Report issues discovered during roof inspection',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: 'inspection',
    mentions: ['qa.team'],
    priority: 'high'
  },
  {
    id: 'inspection-complete',
    title: 'Section Inspection Complete',
    content: 'Completed inspection of {section_name}. Found {issue_count} issues requiring attention. All findings documented and photos uploaded. Ready for QA review.',
    description: 'Mark inspection sections as complete',
    icon: <CheckCircle className="w-4 h-4" />,
    category: 'inspection',
    priority: 'medium'
  },
  {
    id: 'photo-documentation',
    title: 'Photo Documentation Required',
    content: 'Additional photos needed for {location}. Requesting close-up shots of {specific_area} to document {issue_type}. @field.inspector please capture when possible.',
    description: 'Request additional photo documentation',
    icon: <Camera className="w-4 h-4" />,
    category: 'inspection',
    mentions: ['field.inspector']
  },
  {
    id: 'weather-delay',
    title: 'Weather Delay Notice',
    content: 'Inspection delayed due to weather conditions. Current conditions: {weather_status}. Estimated resume time: {resume_time}. Team standby until conditions improve.',
    description: 'Report weather-related inspection delays',
    icon: <Clock className="w-4 h-4" />,
    category: 'inspection',
    priority: 'medium'
  },

  // QA Templates
  {
    id: 'qa-review-request',
    title: 'QA Review Request',
    content: 'Requesting QA review for {pin_location}. {issue_count} issues identified requiring validation. Priority: {priority_level}. @qa.manager please assign reviewer.',
    description: 'Request quality assurance review',
    icon: <FileText className="w-4 h-4" />,
    category: 'qa',
    mentions: ['qa.manager'],
    priority: 'high'
  },
  {
    id: 'qa-approved',
    title: 'QA Approval',
    content: 'QA Review completed for {pin_location}. Status: APPROVED. All issues properly documented and categorized. Ready for client review.',
    description: 'Approve QA inspection results',
    icon: <CheckCircle className="w-4 h-4" />,
    category: 'qa',
    priority: 'medium'
  },
  {
    id: 'qa-needs-revision',
    title: 'QA Revision Required',
    content: 'QA Review requires revision for {pin_location}. Issues found: {revision_notes}. @field.team please address and resubmit for review.',
    description: 'Request revisions after QA review',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: 'qa',
    mentions: ['field.team'],
    priority: 'high'
  },
  {
    id: 'quality-checklist',
    title: 'Quality Checklist Reminder',
    content: 'Quality checklist reminder for {inspection_type}:\n All photos captured\n Issues properly categorized\n GPS coordinates verified\n Safety protocols followed',
    description: 'Quality control checklist for inspections',
    icon: <CheckCircle className="w-4 h-4" />,
    category: 'qa'
  },

  // Collaboration Templates
  {
    id: 'team-coordination',
    title: 'Team Coordination',
    content: 'Team coordination update: {current_status}. @field.team is working on {current_task}. Expected completion: {completion_time}. @project.manager for status updates.',
    description: 'Coordinate team activities and status',
    icon: <Users className="w-4 h-4" />,
    category: 'collaboration',
    mentions: ['field.team', 'project.manager']
  },
  {
    id: 'safety-alert',
    title: 'Safety Alert',
    content: 'SAFETY ALERT: {safety_concern} identified at {location}. All team members avoid area until resolved. @safety.coordinator please assess immediately.',
    description: 'Report safety concerns and hazards',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: 'collaboration',
    mentions: ['safety.coordinator'],
    priority: 'high'
  },
  {
    id: 'equipment-request',
    title: 'Equipment Request',
    content: 'Equipment request: {equipment_type} needed for {task_description} at {location}. Urgency: {urgency_level}. @logistics.team please coordinate delivery.',
    description: 'Request additional equipment or tools',
    icon: <Wrench className="w-4 h-4" />,
    category: 'collaboration',
    mentions: ['logistics.team']
  },
  {
    id: 'shift-handover',
    title: 'Shift Handover',
    content: 'Shift handover summary:\n- Completed: {completed_tasks}\n- In Progress: {ongoing_tasks}\n- Issues: {pending_issues}\n- Next shift priorities: {next_priorities}\n@next.shift.lead',
    description: 'Hand over information to next shift',
    icon: <Clock className="w-4 h-4" />,
    category: 'collaboration',
    mentions: ['next.shift.lead']
  },

  // Reporting Templates
  {
    id: 'daily-summary',
    title: 'Daily Summary Report',
    content: 'Daily Summary - {date}:\n- Pins inspected: {pins_completed}\n- Issues found: {total_issues}\n- Photos captured: {photo_count}\n- Team efficiency: {efficiency_rate}%\nReport ready for @management.team review.',
    description: 'Generate daily inspection summary',
    icon: <FileText className="w-4 h-4" />,
    category: 'reporting',
    mentions: ['management.team']
  },
  {
    id: 'issue-escalation',
    title: 'Issue Escalation',
    content: 'ESCALATION REQUIRED: {issue_description} at {location} requires immediate management attention. Risk level: {risk_level}. @senior.management please review urgently.',
    description: 'Escalate critical issues to management',
    icon: <Zap className="w-4 h-4" />,
    category: 'reporting',
    mentions: ['senior.management'],
    priority: 'high'
  },
  {
    id: 'progress-update',
    title: 'Progress Update',
    content: 'Progress Update - {project_name}:\nOverall completion: {completion_percentage}%\nRemaining pins: {remaining_count}\nExpected finish: {completion_date}\nOn schedule: {schedule_status}',
    description: 'Provide project progress updates',
    icon: <FileText className="w-4 h-4" />,
    category: 'reporting'
  },
  {
    id: 'client-ready',
    title: 'Client Delivery Ready',
    content: 'Inspection complete and client-ready: {project_name}. All QA reviews passed. Final report generated with {total_findings} findings. Ready for client presentation by @client.relations.team.',
    description: 'Mark inspection as ready for client delivery',
    icon: <CheckCircle className="w-4 h-4" />,
    category: 'reporting',
    mentions: ['client.relations.team'],
    priority: 'medium'
  }
]

const getCategoryInfo = (category: string) => {
  switch (category) {
    case 'inspection':
      return { name: 'Inspection', icon: <Pin className="w-4 h-4" />, color: 'bg-blue-500' }
    case 'qa':
      return { name: 'Quality Assurance', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500' }
    case 'collaboration':
      return { name: 'Team Collaboration', icon: <Users className="w-4 h-4" />, color: 'bg-purple-500' }
    case 'reporting':
      return { name: 'Reporting', icon: <FileText className="w-4 h-4" />, color: 'bg-orange-500' }
    default:
      return { name: 'General', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-gray-500' }
  }
}

const getPriorityBadge = (priority?: string) => {
  if (!priority) return null
  
  const variants = {
    high: { variant: 'destructive' as const, label: 'High Priority' },
    medium: { variant: 'default' as const, label: 'Medium' },
    low: { variant: 'secondary' as const, label: 'Low' }
  }
  
  return (
    <Badge variant={variants[priority as keyof typeof variants].variant} className="text-xs">
      {variants[priority as keyof typeof variants].label}
    </Badge>
  )
}

interface TemplateCardProps {
  template: ExampleTemplate
  onUse?: (text: string, mentions?: string[]) => void
  onCopy?: (text: string) => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse, onCopy }) => {
  const categoryInfo = getCategoryInfo(template.category)
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md text-white", categoryInfo.color)}>
              {template.icon}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
              {template.priority && (
                <div className="mt-1">
                  {getPriorityBadge(template.priority)}
                </div>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="text-xs">
          {template.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="bg-muted/25 p-3 rounded-lg">
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
            {template.content}
          </pre>
        </div>
        
        {template.mentions && template.mentions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Mentions:</span>
            {template.mentions.map((mention) => (
              <Badge key={mention} variant="outline" className="text-xs">
                @{mention}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onUse?.(template.content, template.mentions)}
            className="flex-1"
          >
            <Send className="w-3 h-3 mr-1" />
            Use Template
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopy?.(template.content)}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ChatExamples({ onUseTemplate, className }: ChatExampleProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['all', 'inspection', 'qa', 'collaboration', 'reporting']

  const filteredTemplates = EXAMPLE_TEMPLATES.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory
    const matchesSearch = !searchTerm || 
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  const handleCopyTemplate = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // In a real app, you'd show a toast notification here
      console.log('Template copied to clipboard')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const templatesByCategory = categories.slice(1).reduce((acc, category) => {
    acc[category] = EXAMPLE_TEMPLATES.filter(t => t.category === category).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat Message Templates
          </CardTitle>
          <CardDescription>
            Pre-built message templates for common roofing inspection and QA workflows. 
            Click "Use Template" to insert into your chat or copy to customize.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                All ({EXAMPLE_TEMPLATES.length})
              </TabsTrigger>
              {categories.slice(1).map(category => {
                const info = getCategoryInfo(category)
                return (
                  <TabsTrigger key={category} value={category} className="flex items-center gap-1">
                    {info.icon}
                    <span className="hidden sm:inline">
                      {info.name.split(' ')[0]} ({templatesByCategory[category]})
                    </span>
                    <span className="sm:hidden">
                      ({templatesByCategory[category]})
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Template Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  {...(onUseTemplate ? { onUse: onUseTemplate } : {})}
                  onCopy={handleCopyTemplate}
                />
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No templates found matching your criteria.</p>
                <p className="text-sm">Try adjusting your search or category filter.</p>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Usage Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Customization</h4>
              <p className="text-sm text-muted-foreground">
                Replace placeholders like {'{issue_type}'} and {'{location}'} with actual values before sending.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Mentions</h4>
              <p className="text-sm text-muted-foreground">
                Templates include suggested @mentions for relevant team members. Adjust based on your team structure.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Priority Levels</h4>
              <p className="text-sm text-muted-foreground">
                High priority templates are for urgent issues requiring immediate attention.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Categories</h4>
              <p className="text-sm text-muted-foreground">
                Templates are organized by workflow: Inspection, QA, Collaboration, and Reporting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChatExamples