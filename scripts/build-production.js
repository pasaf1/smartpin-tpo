#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting SmartPin TPO Production Build...\n')

const buildSteps = [
  {
    name: 'Type Checking',
    command: 'npx tsc --noEmit',
    description: 'Checking TypeScript types...'
  },
  {
    name: 'Linting',
    command: 'npx next lint',
    description: 'Running ESLint checks...'
  },
  {
    name: 'Database Migrations',
    command: 'npx supabase db push --linked',
    description: 'Applying database migrations...',
    optional: true
  },
  {
    name: 'Building Application',
    command: 'npx next build',
    description: 'Building optimized production bundle...'
  },
  {
    name: 'Bundle Analysis',
    command: 'npx next-bundle-analyzer',
    description: 'Analyzing bundle size...',
    optional: true
  }
]

async function runBuildStep(step) {
  console.log(`📋 ${step.description}`)
  
  try {
    const startTime = Date.now()
    
    execSync(step.command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
    const duration = Date.now() - startTime
    console.log(`✅ ${step.name} completed in ${duration}ms\n`)
    
    return { success: true, duration }
  } catch (error) {
    if (step.optional) {
      console.log(`⚠️  ${step.name} failed (optional step, continuing...)\n`)
      return { success: true, duration: 0, skipped: true }
    } else {
      console.error(`❌ ${step.name} failed:`, error.message)
      return { success: false, error: error.message }
    }
  }
}

async function generateBuildReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    buildTime: results.reduce((sum, r) => sum + (r.duration || 0), 0),
    steps: results,
    success: results.every(r => r.success),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production'
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'build-report.json'),
    JSON.stringify(report, null, 2)
  )

  return report
}

async function main() {
  const results = []
  
  for (const step of buildSteps) {
    const result = await runBuildStep(step)
    results.push({ step: step.name, ...result })
    
    if (!result.success) {
      console.error('🚫 Build failed, stopping...')
      process.exit(1)
    }
  }
  
  const report = await generateBuildReport(results)
  
  console.log('🎉 Production build completed successfully!')
  console.log(`📊 Total build time: ${report.buildTime}ms`)
  console.log(`📝 Build report saved to: build-report.json`)
  
  if (fs.existsSync('.next')) {
    const stats = fs.statSync('.next')
    console.log(`📦 Build output size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`)
  }
  
  console.log('\n🚀 Ready for deployment!')
  console.log('Next steps:')
  console.log('  1. Deploy to your hosting platform')
  console.log('  2. Configure environment variables')
  console.log('  3. Set up monitoring and analytics')
  console.log('  4. Run health checks')
}

main().catch(error => {
  console.error('❌ Build script failed:', error)
  process.exit(1)
})