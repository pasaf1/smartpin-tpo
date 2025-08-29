import { useQuery } from '@tanstack/react-query'
import { useProjects, useRoofsByProject } from './useRoofs'
import { db } from '../supabase-production'

/**
 * Custom hook to calculate total open issues across all projects
 * An issue is defined as:
 * - Each parent pin = 1 issue
 * - Each child pin = 1 additional issue
 * So if a parent pin has 3 children, total issues = 4 (1 parent + 3 children)
 */
export function useOpenIssuesCount() {
  const { data: projects = [] } = useProjects()
  
  return useQuery({
    queryKey: ['issues', 'open', 'count'],
    queryFn: async () => {
      let totalIssues = 0
      
      // Get all open projects
      const openProjects = projects.filter(p => p.status === 'Open')
      
      for (const project of openProjects) {
        try {
          // Get all roofs for this project
          const roofs = await db.roofs.listByProject(project.project_id)
          
          for (const roof of roofs) {
            // Get all pins for this roof
            const pins = await db.pins.listByRoof(roof.id)
            
            // Each pin counts as 1 issue + all its children
            for (const pin of pins) {
              // Parent pin = 1 issue
              totalIssues += 1
              
              // Add children count
              totalIssues += pin.children_total || 0
            }
          }
        } catch (error) {
          console.error('Error calculating issues for project:', project.project_id, error)
        }
      }
      
      return totalIssues
    },
    enabled: projects.length > 0,
    staleTime: 30 * 1000, // Refresh every 30 seconds
    refetchInterval: 60 * 1000, // Auto refresh every minute
  })
}

/**
 * Hook to get issues count for a specific project
 */
export function useProjectIssuesCount(projectId: string) {
  return useQuery({
    queryKey: ['issues', 'project', projectId],
    queryFn: async () => {
      let totalIssues = 0
      
      try {
        // Get all roofs for this project
        const roofs = await db.roofs.listByProject(projectId)
        
        for (const roof of roofs) {
          // Get all pins for this roof
          const pins = await db.pins.listByRoof(roof.id)
          
          // Each pin counts as 1 issue + all its children
          for (const pin of pins) {
            totalIssues += 1 + (pin.children_total || 0)
          }
        }
      } catch (error) {
        console.error('Error calculating issues for project:', projectId, error)
      }
      
      return totalIssues
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}
