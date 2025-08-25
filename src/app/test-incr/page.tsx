'use client'

import { PinDetailsCard } from '@/components/pins/PinDetailsCard'

// Mock pin data for testing
const mockPin = {
  id: 'test-pin-1',
  roof_id: 'roof-e1-demo', 
  seq_number: 1,
  title: 'Test INCR - Seam pressure test',
  description: 'Pneumatic testing required to verify seam integrity under load',
  x_position: 45.5,
  y_position: 32.8,
  severity: 'High' as const,
  status: 'Open' as const,
  created_at: new Date().toISOString(),
  created_by: 'demo-user',
  parent_pin_id: null,
  items: []
}

export default function TestIncrPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">INCR Card Test</h1>
        <div className="bg-white rounded-lg shadow-lg">
          <PinDetailsCard
            pin={mockPin}
            roofId="roof-e1-demo"
            roofName="E1 Demo Roof"
            backgroundImageUrl="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=800&fit=crop"
            onClosurePhoto={(pinId) => console.log('Closure photo:', pinId)}
            onStatusChange={(pinId, status) => console.log('Status change:', pinId, status)}
            onSeverityChange={(pinId, severity) => console.log('Severity change:', pinId, severity)}
          />
        </div>
      </div>
    </div>
  )
}