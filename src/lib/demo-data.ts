// Demo data for SmartPin TPO when Supabase is not configured
import type { PinWithRelations } from './hooks/usePins'

export const mockPins: PinWithRelations[] = [
  {
    id: 'demo-pin-1',
    roof_id: 'e1-demo-roof',
    seq_number: 1,
    x_position: 200,
    y_position: 150,
    status: 'Open',
    title: 'Roof Membrane Issue',
    description: 'Membrane separation detected near drainage area',
    severity: 'High',
    group_count: 3,
    parent_pin_id: null,
    created_at: '2024-08-24T10:00:00Z',
    updated_at: '2024-08-24T10:00:00Z',
    created_by: 'demo-user',
    assigned_to: null,
    due_date: null,
    completed_at: null,
    children: [
      {
        id: 'demo-pin-1-child-1',
        roof_id: 'e1-demo-roof',
        seq_number: 11,
        x_position: 220,
        y_position: 170,
        status: 'Open',
        title: 'Drainage blockage',
        description: 'Water accumulation in drain',
        severity: 'Medium',
        group_count: 0,
        parent_pin_id: 'demo-pin-1',
        created_at: '2024-08-24T10:15:00Z',
        updated_at: '2024-08-24T10:15:00Z',
        created_by: 'demo-user',
        assigned_to: null,
        due_date: null,
        completed_at: null,
      },
      {
        id: 'demo-pin-1-child-2',
        roof_id: 'e1-demo-roof',
        seq_number: 12,
        x_position: 180,
        y_position: 130,
        status: 'ReadyForInspection',
        title: 'Membrane patch',
        description: 'Temporary patch applied',
        severity: 'Low',
        group_count: 0,
        parent_pin_id: 'demo-pin-1',
        created_at: '2024-08-24T10:30:00Z',
        updated_at: '2024-08-24T12:00:00Z',
        created_by: 'demo-user',
        assigned_to: null,
        due_date: null,
        completed_at: null,
      }
    ]
  },
  {
    id: 'demo-pin-2',
    roof_id: 'e1-demo-roof',
    seq_number: 2,
    x_position: 450,
    y_position: 300,
    status: 'Closed',
    title: 'Flashing Repair',
    description: 'Metal flashing secured and sealed',
    severity: 'Medium',
    group_count: 0,
    parent_pin_id: null,
    created_at: '2024-08-24T09:00:00Z',
    updated_at: '2024-08-24T14:00:00Z',
    created_by: 'demo-user',
    assigned_to: null,
    due_date: null,
    completed_at: '2024-08-24T14:00:00Z',
  },
  {
    id: 'demo-pin-3',
    roof_id: 'e1-demo-roof',
    seq_number: 3,
    x_position: 600,
    y_position: 200,
    status: 'ReadyForInspection',
    title: 'Seam Inspection',
    description: 'Welded seam requires quality check',
    severity: 'Critical',
    group_count: 0,
    parent_pin_id: null,
    created_at: '2024-08-24T11:00:00Z',
    updated_at: '2024-08-24T11:00:00Z',
    created_by: 'demo-user',
    assigned_to: null,
    due_date: null,
    completed_at: null,
  }
]

// Add the parent reference to children
mockPins.forEach(pin => {
  if (pin.children) {
    pin.children.forEach(child => {
      (child as PinWithRelations).parent = {
        ...pin,
        children: undefined // Avoid circular reference
      }
    })
  }
})

export const getDemoPins = (roofId: string): PinWithRelations[] => {
  return mockPins.filter(pin => pin.roof_id === roofId)
}

// Demo counters for generating new pins
let nextPinId = 100
let nextSeqNumber = 10

export const createDemoPin = (roofData: {
  roof_id: string
  x_position: number
  y_position: number
  title: string
  description?: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  status?: 'Open' | 'ReadyForInspection' | 'Closed'
  created_by?: string
}): PinWithRelations => {
  const newPin: PinWithRelations = {
    id: `demo-pin-${nextPinId++}`,
    roof_id: roofData.roof_id,
    seq_number: nextSeqNumber++,
    x_position: roofData.x_position,
    y_position: roofData.y_position,
    status: roofData.status || 'Open',
    title: roofData.title,
    description: roofData.description || null,
    severity: roofData.severity,
    group_count: 0,
    parent_pin_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: roofData.created_by || 'demo-user',
    assigned_to: null,
    due_date: null,
    completed_at: null,
  }

  // Add to mock data
  mockPins.push(newPin)
  
  return newPin
}