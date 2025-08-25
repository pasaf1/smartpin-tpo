import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { w: string; h: string } }
) {
  const width = parseInt(params.w) || 400
  const height = parseInt(params.h) || 300
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
            font-family="system-ui, -apple-system, sans-serif" 
            font-size="16" fill="#9ca3af">
        ${width} × ${height}
      </text>
      <path d="M0 0L${width} ${height}M${width} 0L0 ${height}" stroke="#e5e7eb" stroke-width="2"/>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}