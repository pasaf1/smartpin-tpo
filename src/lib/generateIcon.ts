// Generate simple SVG icons for PWA
export function generateIcon(size: number): string {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0088ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#grad)" stroke="white" stroke-width="4"/>
  
  <!-- Pin icon -->
  <g transform="translate(${size/2 - 20}, ${size/2 - 32})">
    <path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm0 28c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="white"/>
    <circle cx="20" cy="20" r="5" fill="#0088ff"/>
  </g>
  
  <!-- Text label -->
  <text x="${size/2}" y="${size - 12}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${size/12}" font-weight="bold" fill="white">TPO</text>
</svg>`
}

export function createIconFile(size: number): Buffer {
  const svg = generateIcon(size)
  return Buffer.from(svg, 'utf8')
}